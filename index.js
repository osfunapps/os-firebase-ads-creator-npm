/*
this is an automated script to create android/ios ad units in AdMob
 */
const ph = require('os-puppeteer-helper');
const tools = require('os-tools');
const mBannerAd = require('./ads/bannerAd');
const mInterAd = require('./ads/interstitialAd');
const mNativeAdvancedAd = require('./ads/NativeAdvancedAd');
const mRewardAd = require('./ads/rewardAd');
const adTypes = require('./ads/AdTypes');
const xh = require("os-xml-file-handler")

// browser related instances

// final links
let LINK_AD_CREATION_HOME = 'https://apps.admob.com/v2/apps/$/adunits/create';
let LINK_APP_CREATION = 'https://apps.admob.com/v2/apps/create';
let PLATFORM_IOS = 'iOS'
let PLATFORM_ANDROID = 'android'

// xml
let XML_ROOT = 'ads'
let XML_AD_NODE = 'ad'
const XML_ATTR_NAME_APP_ID = 'app_id'
let XML_ATTR_TYPE_VAL_DATA = 'data'
let XML_ATTR_TYPE_VAL_BANNER = 'banner'
let XML_ATTR_TYPE_VAL_REWARD = 'reward'

// indications
let currAdIdx = 0;

const self = module.exports = {

    /**
     * will register ad units to an already created admob app
     * @param appId your admob app id
     * @param adsList the list of ads to add
     * @param xmlOutputFilePath the path to the xml file in which all of the ad ids will be saved
     * @param fireFoxNightlyPath the path to your FireFox Nightly runner file
     * In Windows that's usually your firefox.exe file (like 'C:/Program Files/Firefox Nightly/firefox.exe').
     * In Mac that's usually your firefox file, located in your Firefox Nightly.app, inside the Applications dir
     */
    addAdUnitsToExistingApp: async function (appId, adsList, fireFoxNightlyPath, xmlOutputFilePath = null) {
        await addAdUnitsToExistingAppAsync(appId, adsList, xmlOutputFilePath, fireFoxNightlyPath)
    },

    /**
     * will register a new app and ad units to admob
     * @param appName the name which will be stored in admob for reference
     * @param platform select the app's platform ('ios' or 'android')
     * @param adsList the list of ad units to add
     * @param xmlOutputFilePath the path to the xml file in which all of the ad ids will be saved
     * @param fireFoxNightlyPath the path to your FireFox Nightly runner file
     * In Windows that's usually your firefox.exe file (like 'C:/Program Files/Firefox Nightly/firefox.exe').
     * In Mac that's usually your firefox file, located in your Firefox Nightly.app, inside the Applications dir
     */
    registerNewAppWithAdUnits: async function (appName, platform, adsList, fireFoxNightlyPath, xmlOutputFilePath = null) {
        await registerNewAppWithAdUnitsAsync(appName, platform, adsList, fireFoxNightlyPath, xmlOutputFilePath)
    },

    /**
     * will build a banner ad unit
     * @param name ad unit name
     * @param formatsToDisable (Optional) set the types you want to disable. You can put: ['Text, image, and rich media', 'Video']
     */
    buildBannerAdUnit: function (name, formatsToDisable = []) {
        let bannerAd = Object.create(mBannerAd);
        bannerAd.name = name;
        bannerAd.formatsToDisable = formatsToDisable;
        return bannerAd
    },

    /**
     * will build a native advanced ad unit
     * @param name ad unit name
     * @param formatsToDisable (Optional) set the types you want to disable. You can put: ['Image', 'Video']
     */
    buildNativeAdvancedAdUnit: function (name, formatsToDisable = []) {
        let nativeAdvancedAd = Object.create(mNativeAdvancedAd);
        nativeAdvancedAd.name = name;
        nativeAdvancedAd.formatsToDisable = formatsToDisable;
        return nativeAdvancedAd
    },

    /**
     * will build an interstitial ad unit id
     * @param name ad unit name
     * @param formatsToDisable (Optional) set the types you want to disable. You can put: ['Text, image, and rich media', 'Video']
     */
    buildInterstitialAdUnit: function (name, formatsToDisable = []) {
        let interAd = Object.create(mInterAd);
        interAd.name = name;
        interAd.formatsToDisable = formatsToDisable;
        return interAd
    },

    /**
     * will build a reward ad unit id
     * @param name ad unit name
     * @param formatsToDisable (Optional) set the types you want to disable. You can put: ['Include Interactive']
     * @param rewardAmount the amount of the rewards this ad unit worth
     * @param rewardItemName the name of the item this ad grants
     */
    buildRewardAdUnit: function (name,
                                 rewardItemName = 'Reward',
                                 rewardAmount = 1,
                                 formatsToDisable = []) {
        let rewardAd = Object.create(mRewardAd);
        rewardAd.name = name;
        rewardAd.formatsToDisable = formatsToDisable;
        rewardAd.rewardAmount = rewardAmount;
        rewardAd.rewardItemName = rewardItemName;
        return rewardAd
    },

};

async function registerNewAppWithAdUnitsAsync(appName, platform, adsList, fireFoxNightlyPath, xmlOutputFilePath) {

    // create browser
    const tuplee = await ph.createFirefoxBrowser("about:blank", 5, false, 1300, 768, true, fireFoxNightlyPath);
    let page = tuplee[1];

    // register new app
    let appId = await registerNewApp(page, appName, platform);

    await runCyclesAndSave(page, appId, adsList, xmlOutputFilePath)
}

async function registerNewApp(page, appName, platform) {

    // navigate to app creation
    await ph.navigateTo(page, LINK_APP_CREATION, null, '.footer-copyright', null, 3000);

    // mark ios or android
    if (platform === PLATFORM_ANDROID) {
        await ph.clickOnElementContainsText(page, 'div', 'Android')
    } else if (platform === PLATFORM_IOS) {
        await ph.clickOnElementContainsText(page, 'div', 'iOS')
    }

    // click on NO
    await ph.clickOnElementContainsText(page, 'div', 'No', false, 2000);

    // click continue
    await ph.clickOnElementContainsText(page, 'div', 'Continue', false, 2000);

    // set app name (this is probably not the greatest way...)
    await ph.setTextToSelector(page, "material-input", appName);

    await ph.clickOnElementContainsText(page, 'div', 'Add app', false, 10000);

    // wait to finish
    await ph.waitForSelectorWithText(page, 'div', 'Done')

    // click on done
    await ph.clickOnElementContainsText(page, 'div', 'Done')

    // now we are done. The next thing we should do is to get the app id:
    console.log("Waiting for the App settings in the left pane to pop up...")
    await ph.waitForSelectorWithText(page, 'span', 'App settings')
    await ph.clickOnElementContainsText(page, 'span', 'App settings')

    // copying the app id from the correct div, in the App settings
    await ph.waitForSelector(page, "div [summarycontent] span")
    return await ph.readTextFromSelector(page, "div [summarycontent] span")
}


async function addAdUnitsToExistingAppAsync(appId, adsList, outputPath, fireFoxNightlyPath) {
    const tuplee = await ph.createFirefoxBrowser("about:blank", 5, false, 1300, 768, fireFoxNightlyPath);
    let page = tuplee[1];
    await runCyclesAndSave(page, appId, adsList, outputPath)
}


async function runCyclesAndSave(page, appId, adsList, xmlOutputFilePath) {

    // create the link and navigate to ad creation
    let appendedAddr = appId.substring(appId.indexOf('~') + 1);
    let adCreationHome = LINK_AD_CREATION_HOME.replace('$', appendedAddr);

    let xml = null;
    if (xmlOutputFilePath != null) {
        xml = await xh.createXml(XML_ROOT)
        addNode(xml, xmlOutputFilePath, XML_ATTR_NAME_APP_ID, XML_ATTR_TYPE_VAL_DATA, appId)
    }

    // call the next cycle of ad creation
    await onNextCycle(page, adCreationHome, adsList, xmlOutputFilePath, xml);
    await onEnd()
}

function addNode(xml, outputPath, adName, adType, adId) {
    xh.addNode(xml, XML_AD_NODE, {'name': adName, 'type': adType}, adId, xh.getRoot(xml))
    xh.saveXml(xml, outputPath)
}

// // will save the properties as an xml file
// function buildAndSaveXml(outputPath, appId, adsList, appName = null) {
//     let builder = require('xmlbuilder');
//
//     let root = builder.create('root');
//     let appEle = root.ele('App', appId);
//
//     if (appName !== null) {
//         appEle.att('name', appName)
//     }
//
//     let adsEle = root.ele('Ads');
//     let i;
//     for (i = 0; i < adsList.length; i++) {
//         let adEle = adsEle.ele(adsList[i].genericType, adsList[i].id);
//         adEle.att('name', adsList[i].name)
//     }
//
//     const xml = root.end({pretty: true});
//     console.log(xml);
//     tools.textToFile(xml, outputPath + '/ads.xml')
// }

async function onEnd() {
    // kill the browser
    // await browser.close()
}

// will be called when each cycle starts
async function onNextCycle(page, adCreationHome, adsList, xmlOutputFilePath, xml) {

    await ph.navigateTo(page, adCreationHome, null);

    // wait for the title of the "create ad unit to arrive"
    await ph.waitForSelectorWithText(page, 'h1', 'Create ad unit')  // wait for top
    await ph.waitForSelector(page, '.footer-copyright')             // wait for bottom


    if (currAdIdx < adsList.length) {

        // will wait for the copyright footer to pop
        await ph.waitForSelector(page, '.footer-copyright');

        // choose the right ad
        let currAd = adsList[currAdIdx];
        switch (currAd.genericType) {
            case adTypes.TYPE_BANNER:
                await registerBannerAd(page, currAd);
                break;
            case adTypes.TYPE_NATIVE_ADVANCED:
                await registerNativeAdvancedAd(page, currAd);
                break;
            case adTypes.TYPE_INTER:
                await registerInterstitialAd(page, currAd);
                break;
            case adTypes.TYPE_REWARD:
                await registerRewardAd(page, currAd);
                break;
        }

        if (xml != null) {
            addNode(xml, xmlOutputFilePath, currAd.name, currAd.genericType, currAd.id)
        }
        currAdIdx += 1;
        await onNextCycle(page, adCreationHome, adsList, xmlOutputFilePath, xml)
    }
}

async function registerBannerAd(page, currAd) {

    // click on the banner ad
    await ph.clickOnSelector(page, "material-button[aria-label='Banner']");
    await registerAd(page, currAd)
}

async function registerNativeAdvancedAd(page, currAd) {
    // click on the native advanced ad
    await ph.clickOnSelector(page, "material-button[aria-label='Native advanced']");
    await registerAd(page, currAd)
}

async function registerInterstitialAd(page, currAd) {
    // click on the inter ad
    await ph.clickOnSelector(page, "material-button[aria-label='Interstitial']");
    await registerAd(page, currAd)
}

async function registerRewardAd(page, currAd) {

    // click on the reward ad
    await ph.clickOnSelector(page, "material-button[aria-label='Rewarded']");

    await ph.setTextToSelector(page, '.reward-amount input', currAd.rewardAmount.toString());
    await ph.setTextToSelector(page, "textarea[aria-label='Enter reward item']", currAd.rewardItemName);
    await registerAd(page, currAd)

}

async function registerAd(page, currAd) {
    // set name
    await ph.setTextToSelector(page, "div[class~='top-section'] input", currAd.name);

    // mark ad types
    if (currAd.formatsToDisable.length !== 0) {

        // open advanced
        await ph.clickOnElementContainsText(page, "span", "Advanced settings", false);
        await tools.delay(2000)

        for (let i = 0; i < currAd.formatsToDisable.length; i++) {
            console.log("clicking on " + currAd.formatsToDisable[i])
            await ph.clickOnElementContainsText(page, 'div', `${currAd.formatsToDisable[i]} \nhelp_outline`, false, false, true, false, 2000)
        }

    }
    await tools.delay(2000)

    await ph.clickOnSelector(page, "material-yes-no-buttons material-button")

    await ph.waitForSelectorToBeRemoved(page, "div[class~='top-section'] input")
    // await ph.waitForSelectorWithText(page, 'div', 'Create another ad unit')
    await tools.delay(2000)

    currAd.id = await ph.readTextFromSelector(page, '.instructions > ol:nth-child(1) > li:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2)', false);

}
