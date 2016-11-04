import {Injectable, Inject} from '@angular/core'
import {
    AnalyticsConfiguration, ANALYTICS_CONFIGURATION_PROVIDER, AnalyticsAccount,
    TrackerFieldsObject
} from './configuration'
import {isPropertyDefined, isString, isDefined, isObject, getQueryParameters, isPropertySetTo} from "./util";

interface AnalyticsWindow extends Window { // TODO: ga typings eventually
    ga
    ga_debug
    _gaq
}
declare var window: AnalyticsWindow;
type ActionFieldObject = {
    id?
    affiliation?
    revenue?
    tax?
    shipping?
    coupon?
    list?
    step?
    option?
}

@Injectable()
export class Analytics {

    /** contains array-tupels of [type, message] */
    public log: Array<any> = []
    public offlineQueue: any[] = []
    /** indicates if ga.js or analytics.js script tag was created */
    private created = false;

    constructor(@Inject(ANALYTICS_CONFIGURATION_PROVIDER) public configuration: AnalyticsConfiguration) {
        this.configuration.ecommerce = this.configuration.ecommerce && !this.configuration.enhancedEcommerce
        this.configuration.ecommerce = this.configuration.ecommerce && this.configuration.enhancedEcommerce

        // creates the Google Analytics tracker
        if (!this.configuration.delayScriptTag) {
            if (this.configuration.universalAnalytics) {
                this.createAnalyticsScriptTag();
            } else {
                this.createScriptTag();
            }
        }

        // TODO: following part needs migration for ng2 / ui-router
        // // Try to read route configuration and log warning if not possible
        // var $route = {};
        // if (readFromRoute) {
        //     if (!$injector.has('$route')) {
        //         $log.warn('$route service is not available. Make sure you have included ng-route in your application dependencies.');
        //     } else {
        //         $route = $injector.get('$route');
        //     }
        // }
        //
        // // activates page tracking
        // if (trackRoutes) {
        //     var trackingFn = function () {
        //         // Apply $route based filtering if configured
        //         if (readFromRoute) {
        //             // Avoid tracking undefined routes, routes without template (e.g. redirect routes)
        //             // and those explicitly marked as 'do not track'
        //             if (!$route.current || !$route.current.templateUrl || $route.current.doNotTrack) {
        //                 return;
        //             }
        //         }
        //
        //         that._trackPage();
        //     }
        //
        //     if (useUIRouterTransition){
        //         $injector.get('$transitions').onSuccess({}, trackingFn.bind(this))
        //     } else {
        //         $rootScope.$on(pageEvent, trackingFn.bind(this));
        //     }
        // }

    }

    /** @deprecated
     * @param config
     * @return {Analytics} */
    public setCookieConfig(config) { // TODO: remove completely ?
        this.configuration.cookieConfig = config;
        return this;
    }

    /** @deprecated */
    getCookieConfig() { // TODO: remove completely ?
        return this.configuration.cookieConfig;
    }

    /**
     * Can be used to manually create the script-tag if delayScriptTag is set within configuration.
     * */
    public createAnalyticsScriptTag() {
        if (this.created === true) {
            this._log('warn', 'ga.js or analytics.js script tag already created');
            return;
        }

        if (!this.configuration.accounts) {
            this._log('warn', 'No account id set to create analytics script tag');
            return;
        }

        if (this.configuration.disableAnalytics === true) {
            this.configuration.accounts.forEach((trackerObj) => {
                this._log('info', 'Analytics disabled: ' + trackerObj.tracker);
                window['ga-disable-' + trackerObj.tracker] = true;
            });
        }

        var document = window.document;
        var protocol = this.configuration.hybridMobileSupport === true ? 'https:' : '';
        var scriptSource = protocol + '//www.google-analytics.com/' + (this.configuration.debugMode ? 'analytics_debug.js' : 'analytics.js');
        if (this.configuration.testMode !== true) {
            // If not in test mode inject the Google Analytics tag
            (function (i?, s?, o?, g?, r?, a?, m?) {
                i['GoogleAnalyticsObject'] = r;
                i[r] = i[r] || function () {
                        (i[r].q = i[r].q || []).push(arguments);
                    }, i[r].l = 1 * <any> new Date(); // silence TS compiler error "arrithmetic ..."
                a = s.createElement(o),
                    m = s.getElementsByTagName(o)[0];
                a.async = 1;
                a.src = g;
                m.parentNode.insertBefore(a, m);
            })(window, document, 'script', scriptSource, 'ga');
        } else {
            if (typeof window.ga !== 'function') {
                // In test mode create a ga function if none exists that is a noop sink.
                window.ga = () => {
                    this._log('debug', 'ga(' + Array.prototype.slice.call(arguments).join() + ')');
                };
            }
            // Log script injection.
            this._log('inject', scriptSource);
        }

        if (this.configuration.traceDebuggingMode) {
            window.ga_debug = {trace: true};
        }

        this.configuration.accounts.forEach((trackerObj: AnalyticsAccount) => {
            trackerObj.crossDomainLinker = isPropertyDefined('crossDomainLinker', trackerObj) ? trackerObj.crossDomainLinker : this.configuration.crossDomainLinker;
            trackerObj.crossLinkDomains = isPropertyDefined('crossLinkDomains', trackerObj) ? trackerObj.crossLinkDomains : this.configuration.crossLinkDomains;
            trackerObj.displayFeatures = isPropertyDefined('displayFeatures', trackerObj) ? trackerObj.displayFeatures : this.configuration.displayFeatures;
            trackerObj.enhancedLinkAttribution = isPropertyDefined('enhancedLinkAttribution', trackerObj) ? trackerObj.enhancedLinkAttribution : this.configuration.enhancedLinkAttribution;
            trackerObj.set = isPropertyDefined('set', trackerObj) ? trackerObj.set : {};
            trackerObj.trackEcommerce = isPropertyDefined('trackEcommerce', trackerObj) ? trackerObj.trackEcommerce : this.configuration.ecommerce;
            trackerObj.trackEvent = isPropertyDefined('trackEvent', trackerObj) ? trackerObj.trackEvent : false;

            // Logic to choose the account fields to be used.
            // cookieConfig is being deprecated for a tracker specific property: fields.
            var fields: TrackerFieldsObject = {};
            if (isPropertyDefined('fields', trackerObj)) { // TODO: review this parts in regard to cookieConfig handling / deprecation
                fields = trackerObj.fields;
            } else if (isPropertyDefined('cookieConfig', trackerObj)) {
                if (isString(trackerObj.cookieConfig)) {
                    fields.cookieDomain = <string> trackerObj.cookieConfig;
                } else {
                    fields = <TrackerFieldsObject> trackerObj.cookieConfig;
                }
            } else if (isString(this.configuration.cookieConfig)) {
                fields.cookieDomain = this.configuration.cookieConfig;
            } else if (this.configuration.cookieConfig) {
                fields = <TrackerFieldsObject> this.configuration.cookieConfig;
            }
            if (trackerObj.crossDomainLinker === true) {
                fields.allowLinker = true;
            }
            if (isPropertyDefined('name', trackerObj)) {
                fields.name = trackerObj.name;
            }
            trackerObj.fields = fields;

            this._ga('create', trackerObj.tracker, trackerObj.fields);

            // Hybrid mobile application support
            // https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/tasks
            if (this.configuration.hybridMobileSupport === true) {
                this._ga(this.generateCommandName('set', trackerObj), 'checkProtocolTask', null);
            }

            // Send all custom set commands from the trackerObj.set property
            for (var key in trackerObj.set) {
                if (trackerObj.set.hasOwnProperty(key)) {
                    this._ga(this.generateCommandName('set', trackerObj), key, trackerObj.set[key]);
                }
            }

            if (trackerObj.crossDomainLinker === true) {
                this._ga(this.generateCommandName('require', trackerObj), 'linker');
                if (isDefined(trackerObj.crossLinkDomains)) {
                    this._ga(this.generateCommandName('linker:autoLink', trackerObj), trackerObj.crossLinkDomains);
                }
            }

            if (trackerObj.displayFeatures) {
                this._ga(this.generateCommandName('require', trackerObj), 'displayfeatures');
            }

            if (trackerObj.trackEcommerce) {
                if (!this.configuration.enhancedEcommerce) {
                    this._ga(this.generateCommandName('require', trackerObj), 'ecommerce');
                } else {
                    this._ga(this.generateCommandName('require', trackerObj), 'ec');
                    this._ga(this.generateCommandName('set', trackerObj), '&cu', this.configuration.currency);
                }
            }

            if (trackerObj.enhancedLinkAttribution) {
                this._ga(this.generateCommandName('require', trackerObj), 'linkid');
            }

            if (this.configuration.trackRoutes && !this.configuration.ignoreFirstPageLoad) {
                this._ga(this.generateCommandName('send', trackerObj), 'pageview', this.configuration.trackPrefix + this.getUrl());
            }
        });

        if (this.configuration.experimentId) {
            var expScript = document.createElement('script'),
                s = document.getElementsByTagName('script')[0];
            expScript.src = protocol + '//www.google-analytics.com/cx/api.js?experiment=' + this.configuration.experimentId;
            s.parentNode.insertBefore(expScript, s);
        }

        this.created = true;
        return true;
    };

    /**
     * Can be used to manually create the script-tag if delayScriptTag is set within configuration.
     * */
    public createScriptTag() {
        if (this.created === true) {
            this._log('warn', 'ga.js or analytics.js script tag already created');
            return;
        }

        let accounts = this.configuration.accounts
        if (!accounts || accounts.length < 1) {
            this._log('warn', 'No account id set to create script tag');
            return;
        }
        if (accounts.length > 1) {
            this._log('warn', 'Multiple trackers are not supported with ga.js. Using first tracker only');
            accounts = accounts.slice(0, 1);
        }


        if (this.configuration.disableAnalytics === true) {
            this._log('info', 'Analytics disabled: ' + accounts[0].tracker);
            window['ga-disable-' + accounts[0].tracker] = true;
        }

        this._gaq('_setAccount', accounts[0].tracker);
        if (this.configuration.domainName) {
            this._gaq('_setDomainName', this.configuration.domainName);
        }
        if (this.configuration.enhancedLinkAttribution) {
            this._gaq('_require', 'inpage_linkid', '//www.google-analytics.com/plugins/ga/inpage_linkid.js');
        }
        if (this.configuration.trackRoutes && !this.configuration.ignoreFirstPageLoad) {
            if (this.configuration.removeRegExp) {
                this._gaq('_trackPageview', this.getUrl());
            } else {
                this._gaq('_trackPageview');
            }
        }

        var document = window.document;
        var scriptSource;
        if (this.configuration.displayFeatures === true) {
            scriptSource = ('https:' === document.location.protocol ? 'https://' : 'http://') + 'stats.g.doubleclick.net/dc.js';
        } else {
            scriptSource = ('https:' === document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
        }

        if (this.configuration.testMode !== true) {
            // If not in test mode inject the Google Analytics tag
            (function () {
                var ga = document.createElement('script');
                ga.type = 'text/javascript';
                ga.async = true;
                ga.src = scriptSource;
                var s = document.getElementsByTagName('script')[0];
                s.parentNode.insertBefore(ga, s);
            })();
        } else {
            // Log the source location for validation
            this._log('inject', scriptSource);
        }

        this.created = true;
        return true;
    };

    public offline(mode) {
        let offlineMode = this.configuration.offlineMode
        if (mode === true && offlineMode === false) {
            // Go to offline mode
            offlineMode = true;
        }
        if (mode === false && offlineMode === true) {
            // Go to online mode and process the offline queue
            offlineMode = false;
            while (this.offlineQueue.length > 0) {
                var obj = this.offlineQueue.shift();
                obj[0].apply(this, obj[1]);
            }
        }
        return offlineMode;
    }

    /** Get url for current page */
    public getUrl() {
        // Using ngRoute provided tracking urls
        // TODO: add router support for ng / ui router
        // if (this.configuration.readFromRoute && $route.current && ('pageTrack' in $route.current)) {
        //     return $route.current.pageTrack;
        // }

        // Otherwise go the old way
        const path = location.hash.replace('#', '')
        const url = this.configuration.trackUrlParams ? path + location.search : path;
        return this.configuration.removeRegExp ? url.replace(this.configuration.removeRegExp, '') : url;
    }

    /**
     * Track page
     https://developers.google.com/analytics/devguides/collection/gajs/
     https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/pages
     * @param url
     * @param title
     * @param custom
     * @private
     */
    public trackPage(url = this.getUrl(), title = document.title, custom?) {
        this._gaJs(() => {
            // http://stackoverflow.com/questions/7322288/how-can-i-set-a-page-title-with-google-analytics
            this._gaq('_set', 'title', title);
            this._gaq('_trackPageview', (this.configuration.trackPrefix + url));
        });
        this._analyticsJs(() => {
            var opt_fieldObject = {
                'page': this.configuration.trackPrefix + url,
                'title': title
            };
            Object.assign(opt_fieldObject, this.getUtmParams()); // TODO: check if proper replacement for angular.extend!
            if (isObject(custom)) {
                Object.assign(opt_fieldObject, custom); // TODO: check if proper replacement for angular.extend!
            }
            this._gaMultipleTrackers(undefined, 'send', 'pageview', opt_fieldObject);
        });
    };

    /**
     * Track event
     https://developers.google.com/analytics/devguides/collection/gajs/eventTrackerGuide
     https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/events
     * @param category
     * @param action
     * @param label
     * @param value
     * @param noninteraction
     * @param custom
     * @private
     */
    public trackEvent(category, action, label, value?, noninteraction?, custom?) {
        this._gaJs(() => {
            this._gaq('_trackEvent', category, action, label, value, !!noninteraction);
        });
        this._analyticsJs(() => {
            var opt_fieldObject: TrackerFieldsObject = {};
            var includeFn = (trackerObj) => isPropertySetTo('trackEvent', trackerObj, true);

            if (isDefined(noninteraction)) {
                opt_fieldObject.nonInteraction = !!noninteraction;
            }
            if (isObject(custom)) {
                Object.assign(opt_fieldObject, custom); // TODO: check if proper replacement for angular.extend!
            }
            if (!isDefined(opt_fieldObject.page)) {
                opt_fieldObject.page = this.getUrl();
            }
            this._gaMultipleTrackers(includeFn, 'send', 'event', category, action, label, value, opt_fieldObject);
        });
    }

    /**
     * Add transaction
     * https://developers.google.com/analytics/devguides/collection/gajs/methods/gaJSApiEcommerce#_gat.GA_Tracker_._addTrans
     * https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/ecommerce#addTrans
     * @param transactionId
     * @param affiliation
     * @param total
     * @param tax
     * @param shipping
     * @param city
     * @param state
     * @param country
     * @param currency
     * @private
     */
    public addTrans(transactionId, affiliation, total, tax, shipping, city, state, country, currency) {
        this._gaJs(() => {
            this._gaq('_addTrans', transactionId, affiliation, total, tax, shipping, city, state, country);
        });
        this._analyticsJs(() => {
            if (this._ecommerceEnabled(true, 'addTrans')) {
                var includeFn = (trackerObj) => isPropertySetTo('trackEcommerce', trackerObj, true)

                this._gaMultipleTrackers(
                    includeFn,
                    'ecommerce:addTransaction',
                    {
                        id: transactionId,
                        affiliation: affiliation,
                        revenue: total,
                        tax: tax,
                        shipping: shipping,
                        currency: currency || 'USD'
                    });
            }
        });
    };

    /**
     * Add item to transaction
     * https://developers.google.com/analytics/devguides/collection/gajs/methods/gaJSApiEcommerce#_gat.GA_Tracker_._addItem
     * https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/ecommerce#addItem
     * @param transactionId
     * @param sku
     * @param name
     * @param category
     * @param price
     * @param quantity
     * @private
     */
    public addItem(transactionId, sku, name, category, price, quantity) {
        this._gaJs(() => {
            this._gaq('_addItem', transactionId, sku, name, category, price, quantity);
        });
        this._analyticsJs(() => {
            if (this._ecommerceEnabled(true, 'addItem')) {
                var includeFn = (trackerObj) => isPropertySetTo('trackEcommerce', trackerObj, true)

                this._gaMultipleTrackers(
                    includeFn,
                    'ecommerce:addItem',
                    {
                        id: transactionId,
                        name: name,
                        sku: sku,
                        category: category,
                        price: price,
                        quantity: quantity
                    });
            }
        });
    }

    /**
     * Track transaction
     * https://developers.google.com/analytics/devguides/collection/gajs/methods/gaJSApiEcommerce#_gat.GA_Tracker_._trackTrans
     * https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/ecommerce#sendingData
     * @private
     */
    public trackTrans() {
        this._gaJs(()=> {
            this._gaq('_trackTrans');
        })
        this._analyticsJs(()=> {
            if (this._ecommerceEnabled(true, 'trackTrans')) {
                var includeFn = (trackerObj) => isPropertySetTo('trackEcommerce', trackerObj, true)

                this._gaMultipleTrackers(includeFn, 'ecommerce:send');
            }
        });
    };

    /**
     * Track detail
     * @private
     */
    public trackDetail() {
        this.setAction('detail');
        this.pageView();
    }


    /**
     * Track Refund
     * https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/enhanced-ecommerce#measuring-refunds
     * @param transactionId
     * @private
     */
    public trackRefund(transactionId) {
        this.setAction('refund', this.getActionFieldObject(transactionId));
    }

    /**
     * Clear transaction
     * https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/ecommerce#clearingData
     * @private
     */
    public clearTrans() {
        this._analyticsJs(() => {
            if (this._ecommerceEnabled(true, 'clearTrans')) {
                var includeFn = (trackerObj) => isPropertySetTo('trackEcommerce', trackerObj, true)
                this._gaMultipleTrackers(includeFn, 'ecommerce:clear');
            }
        });
    }

    /**
     * Enhanced Ecommerce
     */

    /**
     * Add Product
     * https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/enhanced-ecommerce#product-data
     * @param productId
     * @param name
     * @param category
     * @param brand
     * @param variant
     * @param price
     * @param quantity
     * @param coupon
     * @param position
     * @param custom
     * @private
     */
    private addProduct(productId, name, category, brand, variant, price, quantity, coupon, position, custom) {
        this._gaJs(() => {
            this._gaq('_addProduct', productId, name, category, brand, variant, price, quantity, coupon, position);
        });
        this._analyticsJs(()=> {
            if (this._enhancedEcommerceEnabled(true, 'addProduct')) {
                var includeFn = (trackerObj) => isPropertySetTo('trackEcommerce', trackerObj, true)
                var details = {
                    id: productId,
                    name: name,
                    category: category,
                    brand: brand,
                    variant: variant,
                    price: price,
                    quantity: quantity,
                    coupon: coupon,
                    position: position
                };
                if (isObject(custom)) {
                    Object.assign(details, custom); // TODO: check if proper replacement for angular.extend!
                }
                this._gaMultipleTrackers(includeFn, 'ec:addProduct', details);
            }
        });
    }

    /**
     * Add Promo
     * https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/enhanced-ecommerce
     * @param productId
     * @param name
     * @param creative
     * @param position
     * @private
     */
    public addPromo(productId, name, creative, position) {
        this._gaJs(() => {
            this._gaq('_addPromo', productId, name, creative, position);
        });
        this._analyticsJs(() => {
            if (this._enhancedEcommerceEnabled(true, 'addPromo')) {
                var includeFn = (trackerObj) => isPropertySetTo('trackEcommerce', trackerObj, true)
                this._gaMultipleTrackers(
                    includeFn,
                    'ec:addPromo',
                    {
                        id: productId,
                        name: name,
                        creative: creative,
                        position: position
                    });
            }
        });
    }

    /**
     * Add Impression
     * https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/enhanced-ecommerce#impression-data
     * @param id
     * @param name
     * @param list
     * @param brand
     * @param category
     * @param variant
     * @param position
     * @param price
     * @private
     */
    public addImpression(id, name, list, brand, category, variant, position, price) {
        this._gaJs(() => {
            this._gaq('_addImpression', id, name, list, brand, category, variant, position, price);
        });
        this._analyticsJs(() => {
            if (this._enhancedEcommerceEnabled(true, 'addImpression')) {
                var includeFn = (trackerObj) => isPropertySetTo('trackEcommerce', trackerObj, true)

                this._gaMultipleTrackers(
                    includeFn,
                    'ec:addImpression',
                    {
                        id: id,
                        name: name,
                        category: category,
                        brand: brand,
                        variant: variant,
                        list: list,
                        position: position,
                        price: price
                    });
            }
        });
    }

    /**
     * Track product click
     * https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/enhanced-ecommerce#measuring-promo-clicks
     * @param promotionName
     * @private
     */
    public productClick(listName) {
        this.setAction('click', this.getActionFieldObject(null, null, null, null, null, null, listName, null, null));
        this.trackEvent('UX', 'click', listName);
    }

    /**
     * Set Action
     * https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/enhanced-ecommerce#measuring-actions
     * https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/enhanced-ecommerce#action-types
     * @param action
     * @param obj
     * @private
     */
    public setAction(action, obj?) {
        this._gaJs(() => {
            this._gaq('_setAction', action, obj);
        });
        this._analyticsJs(() => {
            if (this._enhancedEcommerceEnabled(true, 'setAction')) {
                var includeFn = (trackerObj) => isPropertySetTo('trackEcommerce', trackerObj, true)
                this._gaMultipleTrackers(includeFn, 'ec:setAction', action, obj);
            }
        });
    };

    /**
     * Track promo click
     * https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/enhanced-ecommerce#measuring-promo-clicks
     * @param promotionName
     * @private
     */
    public promoClick(promotionName) {
        this.setAction('promo_click');
        this.trackEvent('Internal Promotions', 'click', promotionName);
    };

    /**
     * Send page view
     * @param trackerName
     * @private
     */
    public pageView(trackerName?) {
        this._analyticsJs(() => {
            this._ga(this.generateCommandName('send', trackerName), 'pageview');
        });
    }

    /**
     * Track add/remove to cart
     * https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/enhanced-ecommerce#add-remove-cart
     * @param action
     * @param list
     * @private
     */
    public trackCart(action, listName) {
        if (['add', 'remove'].indexOf(action) !== -1) {
            this.setAction(action, {list: listName});
            this.trackEvent('UX', 'click', action + (action === 'add' ? ' to cart' : ' from cart'));
        }
    }

    /**
     * Track Checkout
     * https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/enhanced-ecommerce#measuring-checkout
     * @param step
     * @param option
     * @private
     */
    public trackCheckOut(step, option) {
        this.setAction('checkout', this.getActionFieldObject(null, null, null, null, null, null, null, step, option));
    }

    /**
     * Track user timings
     * @param timingCategory (Required): A string for categorizing all user timing variables into logical groups(e.g jQuery).
     * @param timingVar (Required): A string to identify the variable being recorded(e.g. JavaScript Load).
     * @param timingValue (Required): The number of milliseconds in elapsed time to report to Google Analytics(e.g. 20).
     * @param timingLabel (Optional): A string that can be used to add flexibility in visualizing user timings in the reports(e.g. Google CDN).
     * @private
     */
    public trackTimings(timingCategory, timingVar, timingValue, timingLabel) {
        this._analyticsJs(() => {
            this._gaMultipleTrackers(undefined, 'send', 'timing', timingCategory, timingVar, timingValue, timingLabel);
        });
    }

    /**
     * Track Transaction
     * https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/enhanced-ecommerce#measuring-transactions
     * @param transactionId
     * @param affiliation
     * @param revenue
     * @param tax
     * @param shipping
     * @param coupon
     * @param list
     * @param step
     * @param option
     * @private
     */
    public trackTransaction(transactionId, affiliation, revenue, tax, shipping, coupon, list, step, option) {
        this.setAction('purchase', this.getActionFieldObject(transactionId, affiliation, revenue, tax, shipping, coupon, list, step, option));
    }

    /**
     * Exception tracking
     * https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/exceptions
     * @param description (Optional): A description of the exception.
     * @param isFatal (Optional): true if the exception was fatal, false otherwise.
     * @private
     */
    public trackException(description, isFatal) {
        this._analyticsJs(() => {
            this._gaMultipleTrackers(undefined, 'send', 'exception', {exDescription: description, exFatal: !!isFatal});
        });
    }

    /**
     * Send custom events
     * https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/user-timings#implementation
     * https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/social-interactions#implementation
     * @private
     */
    public send(...args) {
        args.unshift('send');
        this._analyticsJs(() => {
            this._ga.apply(this, args);
        });
    }

    /**
     * Set custom dimensions, metrics or experiment
     * https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/custom-dims-mets
     * https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/field-reference#customs
     * @param name (Required)
     * @param value (Required)
     * @param trackerName (Optional)
     * @private
     */
    public set(name, value, trackerName) {
        this._analyticsJs(()=> {
            this._ga(this.generateCommandName('set', trackerName), name, value);
        });
    }

    private generateCommandName(commandName, config) {
        if (isString(config)) {
            return config + '.' + commandName;
        }
        return isPropertyDefined('name', config) ? (config.name + '.' + commandName) : commandName;
    }

    private _log(...args: string[]) {
        if (args.length > 0) {
            if (args.length > 1) {
                switch (args[0]) {
                    case 'debug':
                    case 'error':
                    case 'info':
                    case 'log':
                    case 'warn':
                        console[args[0]](args.slice(1)); // TODO: replace $log with...?? console for now
                        break;
                }
            }
            this.log.push(args);
        }
    }

    private _ga(...args) {
        if (this.configuration.offlineMode === true) {
            this.offlineQueue.push([this._ga, args]);
            return;
        }
        if (typeof window.ga !== 'function') {
            this._log('warn', 'ga function not set on window');
            return;
        }
        if (this.configuration.logAllCalls === true) {
            this._log.apply(this, args);
        }
        window.ga.apply(null, args);
    };

    private _gaq(...args) {
        if (this.configuration.offlineMode === true) {
            this.offlineQueue.push([this._gaq, args]);
            return;
        }
        if (!window._gaq) {
            window._gaq = [];
        }
        if (this.configuration.logAllCalls === true) {
            this._log.apply(this, args);
        }
        window._gaq.push(args);
    };

    private _analyticsJs(fn) {
        if (this.configuration.universalAnalytics && window.ga && typeof fn === 'function') {
            fn();
        }
    }

    private _gaJs(fn) {
        if (!this.configuration.universalAnalytics && window._gaq && typeof fn === 'function') {
            fn();
        }
    }

    private _gaMultipleTrackers(includeFn, ...args) {
        // preserve the original command name
        const commandName = args[0]
        let trackers = []
        if (typeof includeFn === 'function') {
            this.configuration.accounts.forEach((account) => {
                if (includeFn(account)) {
                    trackers.push(account);
                }
            });
        } else {
            // No include function indicates that all accounts are to be used
            trackers = this.configuration.accounts;
        }

        // To preserve backwards compatibility fallback to _ga method if no account
        // matches the specified includeFn. This preserves existing behaviors by
        // performing the single tracker operation.
        if (trackers.length === 0) {
            this._ga.apply(this, args);
            return;
        }

        trackers.forEach((tracker) => {
            // Check tracker 'select' function, if it exists, for whether the tracker should be used with the current command.
            // If the 'select' function returns false then the tracker will not be used with the current command.
            if (isPropertyDefined('select', tracker) && typeof tracker.select === 'function' && !tracker.select(args)) {
                return;
            }
            args[0] = this.generateCommandName(commandName, tracker);
            this._ga.apply(this, args);
        });
    };

    private getUtmParams() {
        var utmToCampaignVar = {
            utm_source: 'campaignSource',
            utm_medium: 'campaignMedium',
            utm_term: 'campaignTerm',
            utm_content: 'campaignContent',
            utm_campaign: 'campaignName'
        };
        var object = {};

        const queryParams = getQueryParameters(location.search)
        Object.keys(queryParams).forEach((key)=> {
            var campaignVar = utmToCampaignVar[key];

            if (isDefined(campaignVar)) {
                object[campaignVar] = queryParams[key];
            }
        })

        return object;
    };

    private _ecommerceEnabled(warn, command) {
        var result = this.configuration.ecommerce && !this.configuration.enhancedEcommerce;
        if (warn === true && result === false) {
            if (this.configuration.ecommerce && this.configuration.enhancedEcommerce) {
                this._log('warn', command + ' is not available when Enhanced Ecommerce is enabled with analytics.js');
            } else {
                this._log('warn', 'Ecommerce must be enabled to use ' + command + ' with analytics.js');
            }
        }
        return result;
    };


    private _enhancedEcommerceEnabled(warn, command) {
        var result = this.configuration.ecommerce && this.configuration.enhancedEcommerce;
        if (warn === true && result === false) {
            this._log('warn', 'Enhanced Ecommerce must be enabled to use ' + command + ' with analytics.js');
        }
        return result;
    }


    /**
     * get ActionFieldObject
     * https://developers.google.com/analytics/devguides/collection/configuration.universalAnalytics/enhanced-ecommerce#action-data
     * @param id
     * @param affiliation
     * @param revenue
     * @param tax
     * @param shipping
     * @param coupon
     * @param list
     * @param step
     * @param option
     */
    private getActionFieldObject(id?, affiliation?, revenue?, tax?, shipping?, coupon?, list?, step?, option?): ActionFieldObject {
        // @formatter:off
        var obj: ActionFieldObject = {};
        if (id) { obj.id = id; }
        if (affiliation) { obj.affiliation = affiliation; }
        if (revenue) { obj.revenue = revenue; }
        if (tax) { obj.tax = tax; }
        if (shipping) { obj.shipping = shipping; }
        if (coupon) { obj.coupon = coupon; }
        if (list) { obj.list = list; }
        if (step) { obj.step = step; }
        if (option) { obj.option = option; }
        return obj;
        // @formatter:on
    }

}
