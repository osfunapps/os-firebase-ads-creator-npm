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


// browser related instances
let page;
let browser;

// final links
let LINK_AD_CREATION_HOME = 'https://apps.admob.com/v2/apps/$/adunits/create';
let LINK_APP_CREATION = 'https://apps.admob.com/v2/apps/create';

// indications
let currAdIdx = 0;

const self = module.exports = {

    /**
     * will register ad units to an already created admob app
     * @param appId -> your admob app id
     * @param adsList -> the list of ads to add
     * @param outputPath -> the path to the dir in which the xml file of the ids will be saved
     */
    addAdUnitsToExistingApp: async function (appId, adsList, outputPath) {
        await addAdUnitsToExistingAppAsync(appId, adsList, outputPath)
    },

    /**
     * will register a new app and ad units to admob
     * @param appName -> the name which will be stored in admob for reference
     * @param iosOrAndroid -> select the app's platform ('ios' or 'android')
     * @param adsList -> the list of ad units to add
     * @param outputPath -> the path to the dir in which the xml file, holding the ad unit ids, will be stored
     */
    registerNewAppWithAdUnits: async function (appName, iosOrAndroid, adsList, outputPath) {
        await registerNewAppWithAdUnitsAsync(appName, iosOrAndroid, adsList, outputPath)
    },

    /**
     * will build a banner ad unit
     * @param name -> ad unit name
     * @param formatsToDisable -> (Optional) set the types you want to disable. You can put: ['Text, image, and rich media', 'Video']
     */
    buildBannerAdUnit: function (name, formatsToDisable = []) {
        let bannerAd = Object.create(mBannerAd);
        bannerAd.name = name;
        bannerAd.formatsToDisable = formatsToDisable;
        return bannerAd
    },

    /**
     * will build a native advanced ad unit
     * @param name -> ad unit name
     * @param formatsToDisable -> (Optional) set the types you want to disable. You can put: ['Image', 'Video']
     */
    buildNativeAdvancedAdUnit: function (name, formatsToDisable = []) {
        let nativeAdvancedAd = Object.create(mNativeAdvancedAd);
        nativeAdvancedAd.name = name;
        nativeAdvancedAd.formatsToDisable = formatsToDisable;
        return nativeAdvancedAd
    },

    /**
     * will build an interstitial ad unit id
     * @param name -> ad unit name
     * @param formatsToDisable -> (Optional) set the types you want to disable. You can put: ['Text, image, and rich media', 'Video']
     */
    buildInterstitialAdUnit: function (name, formatsToDisable = []) {
        let interAd = Object.create(mInterAd);
        interAd.name = name;
        interAd.formatsToDisable = formatsToDisable;
        return interAd
    },

    /**
     * will build a reward ad unit id
     * @param name -> ad unit name
     * @param formatsToDisable -> (Optional) set the types you want to disable. You can put: ['Include Interactive']
     * @param rewardAmount -> the amount of the rewards this ad unit worth
     * @param rewardItemName -> the name of the item this ad grants
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

async function registerNewAppWithAdUnitsAsync(appName, iosOrAndroid, adsList, outputPath) {

    // create browser
    const tuplee = await ph.createBrowser("about:blank");
    browser = tuplee[0];
    page = tuplee[1];

    // register new app
    let appId = await registerNewApp(appName, iosOrAndroid);

    // create the link and navigate to ad creation
    let adCreationHome = buildAdCreationHomeLink(appId);
    await ph.navigateTo(page, adCreationHome, null, "apps-sidebar-menu-item", null);

    // start implementing the ads
    await onNextCycle(adCreationHome, adsList);
    buildAndSaveXml(outputPath, appId, adsList, appName);
    await onEnd()
}

async function registerNewApp(appName, iosOrAndroid) {

    // navigate to app creation
    await ph.navigateTo(page, LINK_APP_CREATION, null, '.footer-copyright', null, 3000);

    // click on NO
    await ph.clickOnElementContainsText(page, 'div', 'No', false, 2000);

    // set app name
    await ph.setText(page, "div[class~=app-name] input", appName);

    // mark ios or android
    iosOrAndroid = iosOrAndroid.toLowerCase();
    if(iosOrAndroid === 'android') {
        await ph.clickOnElementContainsText(page, 'div', 'Android')
    } else {
        await ph.clickOnElementContainsText(page, 'div', 'iOS')
    }

    await ph.clickOnElementContainsText(page, 'div', 'Add', false, 2000, ".app-id-text");

    let unparsedAppId = await ph.readText(page, ".app-id-text");
    return unparsedAppId.substring(unparsedAppId.indexOf('ca'))
}

async function addAdUnitsToExistingAppAsync(appId, adsList, outputPath) {
    const tuplee = await ph.createBrowser("about:blank");
    browser = tuplee[0];
    page = tuplee[1];
    let adCreationHome = buildAdCreationHomeLink(appId);

    // navigate to ad creation
    await ph.navigateTo(page, adCreationHome, null, "apps-sidebar-menu-item", null);

    await onNextCycle(adCreationHome, adsList);
    buildAndSaveXml(outputPath, appId, adsList);
    await onEnd()
}

// will save the properties as an xml file
function buildAndSaveXml(outputPath, appId, adsList, appName = null) {
    let builder = require('xmlbuilder');

    let root = builder.create('root');
    let appEle = root.ele('App', appId);

    if(appName !== null) {
        appEle.att('name', appName)
    }

    let adsEle = root.ele('Ads');
    let i;
    for (i = 0; i < adsList.length; i++) {
        let adEle = adsEle.ele(adsList[i].genericType, adsList[i].id);
        adEle.att('name', adsList[i].name)
    }

    const xml = root.end({pretty: true});
    console.log(xml);
    tools.textToFile(xml, outputPath + '/ads.xml')
}



// will build the link of the ads creation home
function buildAdCreationHomeLink(appId) {
    let appendedAddr = appId.substring(appId.indexOf('~') + 1);
    return LINK_AD_CREATION_HOME.replace('$', appendedAddr);
}
async function onEnd() {
    // kill the browser
    await browser.close()
}

// will be called when each cycle starts
async function onNextCycle(adCreationHome, adsList) {

    if (currAdIdx < adsList.length) {

        // will wait for the copyright footer to pop
        await ph.waitForSelector(page, '.footer-copyright');

        // choose the right ad
        let currAd = adsList[currAdIdx];
        switch (currAd.genericType) {
            case adTypes.TYPE_BANNER:
                await registerBannerAd(currAd);
                break;
            case adTypes.TYPE_NATIVE_ADVANCED:
                await registerNativeAdvancedAd(currAd);
                break;
            case adTypes.TYPE_INTER:
                await registerInterstitialAd(currAd);
                break;
            case adTypes.TYPE_REWARD:
                await registerRewardAd(currAd);
                break;
        }

        currAdIdx += 1;
        await onNextCycle(adCreationHome, adsList)
    }
}

async function registerBannerAd(currAd) {

    // click on the banner ad
    await ph.click(page, 'section.ad-format-card:nth-child(1) > material-button:nth-child(3) > div:nth-child(1)', 0, '.advanced-settings-toggle');
    await registerAd(currAd)
}

async function registerNativeAdvancedAd(currAd) {
    // click on the native advanced ad
    await ph.click(page, 'section.ad-format-card:nth-child(4) > material-button:nth-child(3) > div:nth-child(1)', 0, '.advanced-settings-toggle');
    await registerAd(currAd)
}

async function registerInterstitialAd(currAd) {
    // click on the inter ad
    await ph.click(page, 'section.ad-format-card:nth-child(2) > material-button:nth-child(3) > div:nth-child(1)', 0, '.advanced-settings-toggle');
    await registerAd(currAd)
}

async function registerRewardAd(currAd) {

    // click on the reward ad
    await ph.click(page, 'section.ad-format-card:nth-child(3) > material-button:nth-child(3) > div:nth-child(1)', 0, '.advanced-settings-toggle');

    await ph.setText(page, '.reward-amount input', currAd.rewardAmount.toString());
    await ph.setText(page, '.reward-type input', currAd.rewardItemName);
    await registerAd(currAd)

}

async function registerAd(currAd) {
    // set name
    await ph.setText(page, "div[class~='top-section'] input", currAd.name);

    // open advanced
    await ph.clickOnElementContainsText(page, "div", "Advanced settings", false, 2000);


    // mark ad types
    let i;
    for (i = 0; i < currAd.formatsToDisable.length; i++) {
        await ph.clickOnElementContainsText(page, 'div', currAd.formatsToDisable[i], false, 1000)
    }

    // click on create another ad unit and wait
    await ph.clickOnElementContainsText(page, "div", "CREATE AD UNIT", false, 1000, "material-button.btn:nth-child(1) > div:nth-child(1)");
    currAd.id = await ph.readText(page, '.instructions > ol:nth-child(1) > li:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2)');
    await ph.clickOnElementContainsText(page, "div", "CREATE ANOTHER AD UNIT")

}
