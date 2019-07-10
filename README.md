Introduction
------------

This module aim to automate new ad units registration in Google's AdMob.

## Installation
Install via npm:
    
    npm i os-firebase-ads-creator


## Usage       
Require ac:
        
    var ac = require("os-firebase-ads-creator")

     
Create ad units:     
    
    adsList.push(ac.buildBannerAdUnit('cool banner'));
    adsList.push(ac.buildInterstitialAdUnit('cool interstitial'));
    adsList.push(ac.buildNativeAdvancedAdUnit('cool native advanced'))
    adsList.push(ac.buildRewardAdUnit('cool reward', 'Dragon Sword', 1))

** see the build signatures for each ad unit for more build arguments
 
If your app isn't registered yet to AdMob:

    ac.registerNewAppWithAdUnits('Your New App Name', 'ios', adsList, '/xml/output/path/');


If your app already registered:

    ac.addAdUnitsToExistingApp('your exiting app's admob id', adsList, '/xml/output/path/');


You can also save the output:

    <?xml version="1.0"?>
    <root>
      <App>ca-app-pub-8903917656945904~8745491231</App>
      <Ads>
        <banner name="cool banner">ca-app-pub-8903917656945904/3116979782</banner>
        <interstitial name="cool interstitial">ca-app-pub-8903917656945904/1229183040</interstitial>
        <native_advanced name="cool native advanced">ca-app-pub-8903917656945904/5551571435</native_advanced>
        <reward name="cool reward">ca-app-pub-8903917656945904/6289938033</reward>
      </Ads>
    </root>

## Additional notes
This is an automated module which uses [os-puppeteer-helper](https://github.com/osfunapps/os-puppeteer-helper-npm) to automate the ads registration. 

If you all about automation, checkout  [os-firebase-project-creator](https://github.com/osfunapps/os-firebase-project-creator-npm) to automate firebase project creation.  

## Links
[npm os-puppeteer-helper](https://github.com/osfunapps/os-puppeteer-helper-npm)

## Licence
ISC