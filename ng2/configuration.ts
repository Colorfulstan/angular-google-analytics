import {Injectable, OpaqueToken} from "@angular/core";
import {isUndefined, isArray, isObject} from "./util";
export type AnalyticsAccount = { // TODO: review typing / options
    name?: string
    /** Tracker Id from google analytics */
    tracker: string
    trackEvent: boolean
    crossDomainLinker?: boolean
    crossLinkDomains?: string[]
    displayFeatures?: boolean
    enhancedLinkAttribution?: boolean
    set?: { [key: string]: any } // TODO: review this typing
    trackEcommerce?: boolean
    /** @deprecated in favor of fields property */
    cookieConfig? : CookieConfig // TODO: can this just be removed?
    fields?: TrackerFieldsObject
}

// for full reference:
// https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference
export interface TrackerFieldsObject extends CookieConfig { // TODO: complete typings
    allowLinker?: boolean
    name?: string
    nonInteraction?: boolean
    page?: string
}

export interface CookieConfig {
    cookieDomain?: string
    cookieName?: string
    cookieExpires?: number
}

export type AnalyticsConfiguration = {
    accounts: AnalyticsAccount[],

    /** previously analyticsJS */
    universalAnalytics: boolean
    /**@deprecated in favor of trackerspecific property: fields.
     * Set it there for the specific tracker */
    cookieConfig: string
    created: boolean
    crossDomainLinker: boolean
    currency: string
    debugMode: boolean
    delayScriptTag: boolean
    displayFeatures: boolean
    disableAnalytics: boolean
    ecommerce: boolean
    enhancedEcommerce: boolean
    enhancedLinkAttribution: boolean
    ignoreFirstPageLoad: boolean
    logAllCalls: boolean
    hybridMobileSupport: boolean
    offlineMode: boolean
    pageEvent: string // TODO: needs specific work and design to be usable with multiple routers
    useUIRouterTransition: boolean
    readFromRoute: boolean
    testMode: boolean
    traceDebuggingMode: boolean
    trackPrefix: string
    trackRoutes: boolean
    trackUrlParams: boolean;

    domainName?: string
    crossLinkDomains?: string[]
    experimentId?, // TODO: typing // TODO: defaults / optional??
    removeRegExp?: RegExp, // TODO: defaults / optional??

}

export let ANALYTICS_CONFIGURATION: AnalyticsConfiguration = {
    accounts: [],
    universalAnalytics: true,
    cookieConfig: 'auto', // DEPRECATED
    created: false,
    crossDomainLinker: false,
    currency: 'USD',
    debugMode: false,
    delayScriptTag: false,
    displayFeatures: false,
    disableAnalytics: false,
    ecommerce: false,
    enhancedEcommerce: false,
    enhancedLinkAttribution: false,
    ignoreFirstPageLoad: false,
    logAllCalls: false,
    hybridMobileSupport: false,
    offlineMode: false,
    pageEvent: '$routeChangeSuccess',
    useUIRouterTransition: false,
    readFromRoute: false,
    testMode: false,
    traceDebuggingMode: false,
    trackPrefix: '',
    trackRoutes: true,
    trackUrlParams: false
}

// TODO: should the configurations-methods live on the Configurations-object?

@Injectable()
export class ANALYTICS_CONFIGURATION_PROVIDER extends OpaqueToken {
    /**
     * Configuration Methods
     **/

    public static setAccount(tracker) {
        if (isUndefined(tracker) || tracker === false) {
            ANALYTICS_CONFIGURATION.accounts = undefined;
        } else if (isArray(tracker)) {
            ANALYTICS_CONFIGURATION.accounts = tracker;
        } else if (isObject(tracker)) {
            ANALYTICS_CONFIGURATION.accounts = [tracker];
        } else {
            // In order to preserve an existing behavior with how the _trackEvent function works,
            // the trackEvent property must be set to true when there is only a single tracker.
            ANALYTICS_CONFIGURATION.accounts = [{tracker: tracker, trackEvent: true}];
        }
        return ANALYTICS_CONFIGURATION_PROVIDER
    };

    public static trackPages(val) {
        ANALYTICS_CONFIGURATION.trackRoutes = !!val;
        return ANALYTICS_CONFIGURATION_PROVIDER
    };

    // TODO: methodname changed!
    public static setTrackPrefix(prefix) {
        ANALYTICS_CONFIGURATION.trackPrefix = prefix;
        return ANALYTICS_CONFIGURATION_PROVIDER
    };

    public static setDomainName(domain) {
        ANALYTICS_CONFIGURATION.domainName = domain;
        return ANALYTICS_CONFIGURATION_PROVIDER
    };

    public static useDisplayFeatures(val) {
        ANALYTICS_CONFIGURATION.displayFeatures = !!val;
        return ANALYTICS_CONFIGURATION_PROVIDER
    };

    public static useAnalytics = function (val) {
        ANALYTICS_CONFIGURATION.universalAnalytics = !!val;
        return this;
    };

    public static useEnhancedLinkAttribution(val) {
        ANALYTICS_CONFIGURATION.enhancedLinkAttribution = !!val;
        return ANALYTICS_CONFIGURATION_PROVIDER
    };

    public static useCrossDomainLinker(val) {
        ANALYTICS_CONFIGURATION.crossDomainLinker = !!val;
        return ANALYTICS_CONFIGURATION_PROVIDER
    };

    public static setCrossLinkDomains(domains) {
        ANALYTICS_CONFIGURATION.crossLinkDomains = domains;
        return ANALYTICS_CONFIGURATION_PROVIDER
    };

    public static setPageEvent(name) {
        ANALYTICS_CONFIGURATION.pageEvent = name;
        return ANALYTICS_CONFIGURATION_PROVIDER
    };

    // TODO: method name changed
    public static setUseUIRouterTransition(bool) {
        ANALYTICS_CONFIGURATION.useUIRouterTransition = bool;
        return ANALYTICS_CONFIGURATION_PROVIDER
    };

    public static useECommerce(val, enhanced) {
        ANALYTICS_CONFIGURATION.ecommerce = !!val;
        ANALYTICS_CONFIGURATION.enhancedEcommerce = !!enhanced;
        return ANALYTICS_CONFIGURATION_PROVIDER
    };

    public static setCurrency(currencyCode) {
        ANALYTICS_CONFIGURATION.currency = currencyCode;
        return ANALYTICS_CONFIGURATION_PROVIDER
    };

    public static setRemoveRegExp(regex) {
        if (regex instanceof RegExp) {
            ANALYTICS_CONFIGURATION.removeRegExp = regex;
        }
        return ANALYTICS_CONFIGURATION_PROVIDER
    };

    public static setExperimentId(id) {
        ANALYTICS_CONFIGURATION.experimentId = id;
        return ANALYTICS_CONFIGURATION_PROVIDER
    };

    // TODO: methodname changed
    public static setIgnoreFirstPageLoad(val) {
        ANALYTICS_CONFIGURATION.ignoreFirstPageLoad = !!val;
        return ANALYTICS_CONFIGURATION_PROVIDER
    };

    // TODO: methodname changed
    public static setTrackUrlParams(val) {
        ANALYTICS_CONFIGURATION.trackUrlParams = !!val;
        return ANALYTICS_CONFIGURATION_PROVIDER
    };

    // TODO: methodname changed
    public static setDisableAnalytics(val) {
        ANALYTICS_CONFIGURATION.disableAnalytics = !!val;
        return ANALYTICS_CONFIGURATION_PROVIDER
    };

    public static setHybridMobileSupport(val) {
        ANALYTICS_CONFIGURATION.hybridMobileSupport = !!val;
        return ANALYTICS_CONFIGURATION_PROVIDER
    };

    public static startOffline(val) {
        ANALYTICS_CONFIGURATION.offlineMode = !!val;
        if (ANALYTICS_CONFIGURATION.offlineMode === true) {
            ANALYTICS_CONFIGURATION_PROVIDER.setDelayScriptTag(true);
        }
        return ANALYTICS_CONFIGURATION_PROVIDER
    };

    // TODO: methodname changed
    public static setDelayScriptTag(val) {
        ANALYTICS_CONFIGURATION.delayScriptTag = !!val;
        return ANALYTICS_CONFIGURATION_PROVIDER
    };

    // TODO: methodname changed
    public static setLogAllCalls(val) {
        ANALYTICS_CONFIGURATION.logAllCalls = !!val;
        return ANALYTICS_CONFIGURATION_PROVIDER
    };

    public static enterTestMode() {
        ANALYTICS_CONFIGURATION.testMode = true;
        return ANALYTICS_CONFIGURATION_PROVIDER
    };

    public static enterDebugMode(enableTraceDebugging) {
        ANALYTICS_CONFIGURATION.debugMode = true;
        ANALYTICS_CONFIGURATION.traceDebuggingMode = !!enableTraceDebugging;
        return ANALYTICS_CONFIGURATION_PROVIDER
    };

    // TODO: methodname changed
    // Enable reading page url from route object
    public static setReadFromRoute(val) {
        ANALYTICS_CONFIGURATION.readFromRoute = !!val;
        return ANALYTICS_CONFIGURATION_PROVIDER
    };
}