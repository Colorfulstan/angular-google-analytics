import './polyfills'

import {BrowserDynamicTestingModule, platformBrowserDynamicTesting} from '@angular/platform-browser-dynamic/testing'
import {TestBed} from '@angular/core/testing'

/** sets up the testing environment for angular */
function initTestBed() {
    TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting())
}

initTestBed()