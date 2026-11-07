const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const infoPlistPath = path.resolve(__dirname, '../ios/SABCA/Info.plist');
const privacyManifestPath = path.resolve(__dirname, '../ios/SABCA/PrivacyInfo.xcprivacy');
const appJsonPath = path.resolve(__dirname, '../app.json');
const pbxprojPath = path.resolve(__dirname, '../ios/SABCA.xcodeproj/project.pbxproj');

test('Apple Compliance: Info.plist Permissions & Configuration', async (t) => {
    assert(fs.existsSync(infoPlistPath), 'Info.plist must exist');
    const content = fs.readFileSync(infoPlistPath, 'utf8');

    await t.test('Verifies NSCameraUsageDescription is present with end-user purpose', () => {
        assert(content.includes('<key>NSCameraUsageDescription</key>'), 'NSCameraUsageDescription missing');
        assert(content.includes('camera access so you can take and upload a profile photo'), 'Generic camera description detected');
    });

    await t.test('Verifies NSFaceIDUsageDescription is present with clear explanation', () => {
        assert(content.includes('<key>NSFaceIDUsageDescription</key>'), 'NSFaceIDUsageDescription missing');
        assert(content.includes('Face ID or Touch ID to provide secure, biometric authentication'), 'Face ID description missing purpose');
    });

    await t.test('Verifies NSPhotoLibraryUsageDescription & Add descriptions', () => {
        assert(content.includes('<key>NSPhotoLibraryUsageDescription</key>'), 'NSPhotoLibraryUsageDescription missing');
        assert(content.includes('<key>NSPhotoLibraryAddUsageDescription</key>'), 'NSPhotoLibraryAddUsageDescription missing');
    });

    await t.test('Verifies App Transport Security (ATS) has NSAllowsArbitraryLoads = false', () => {
        assert(content.includes('<key>NSAppTransportSecurity</key>'), 'NSAppTransportSecurity missing');
        assert(content.includes('<key>NSAllowsArbitraryLoads</key>\n      <false/>'), 'Arbitrary loads must be false');
    });

    await t.test('Verifies UIRequiresFullScreen = true for iPad portrait compliance', () => {
        assert(content.includes('<key>UIRequiresFullScreen</key>\n    <true/>'), 'UIRequiresFullScreen must be true');
    });

    await t.test('Verifies UISupportedInterfaceOrientations~ipad is explicitly declared', () => {
        assert(content.includes('<key>UISupportedInterfaceOrientations~ipad</key>'), 'UISupportedInterfaceOrientations~ipad must be declared');
    });

    await t.test('Verifies ITSAppUsesNonExemptEncryption is false', () => {
        assert(content.includes('<key>ITSAppUsesNonExemptEncryption</key>\n    <false/>'), 'ITSAppUsesNonExemptEncryption must be false');
    });

    await t.test('Verifies UIBackgroundModes is not declared (no unapproved background execution)', () => {
        assert(!content.includes('<key>UIBackgroundModes</key>'), 'Unused UIBackgroundModes declared');
    });
});

test('Apple Compliance: PrivacyInfo.xcprivacy Required Reason APIs & Data Collection', async (t) => {
    assert(fs.existsSync(privacyManifestPath), 'PrivacyInfo.xcprivacy must exist');
    const content = fs.readFileSync(privacyManifestPath, 'utf8');

    await t.test('Asserts zero SDK-only reason codes in main app target', () => {
        assert(!content.includes('<string>0A2A.1</string>'), 'Found SDK-only reason code 0A2A.1');
        assert(!content.includes('<string>85F4.1</string>'), 'Found unrendered disk space reason 85F4.1');
    });

    await t.test('Asserts valid required reason codes for FileTimestamp, DiskSpace, UserDefaults, BootTime', () => {
        assert(content.includes('<string>CA92.1</string>'), 'UserDefaults reason CA92.1 missing');
        assert(content.includes('<string>C617.1</string>'), 'FileTimestamp reason C617.1 missing');
        assert(content.includes('<string>E174.1</string>'), 'DiskSpace reason E174.1 missing');
        assert(content.includes('<string>35F9.1</string>'), 'BootTime reason 35F9.1 missing');
    });

    await t.test('Asserts NSPrivacyTracking is false', () => {
        assert(content.includes('<key>NSPrivacyTracking</key>\n\t<false/>'), 'NSPrivacyTracking must be false');
    });

    await t.test('Asserts all 6 collected data categories are declared under AppFunctionality', () => {
        assert(content.includes('NSPrivacyCollectedDataTypeName'), 'Missing Name data type');
        assert(content.includes('NSPrivacyCollectedDataTypeEmailAddress'), 'Missing EmailAddress data type');
        assert(content.includes('NSPrivacyCollectedDataTypePhoneNumber'), 'Missing PhoneNumber data type');
        assert(content.includes('NSPrivacyCollectedDataTypePhysicalAddress'), 'Missing PhysicalAddress data type');
        assert(content.includes('NSPrivacyCollectedDataTypePhotosOrVideos'), 'Missing PhotosOrVideos data type');
        assert(content.includes('NSPrivacyCollectedDataTypeUserID'), 'Missing UserID data type');
        assert(content.includes('NSPrivacyCollectedDataTypePurposeAppFunctionality'), 'Missing AppFunctionality purpose');
    });
});

test('Apple Compliance: Project Configurations & iPad Universal Support', async (t) => {
    assert(fs.existsSync(appJsonPath), 'app.json must exist');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

    await t.test('Verifies app.json tablet and bundle configuration', () => {
        assert.strictEqual(appJson.expo.ios.supportsTablet, true, 'supportsTablet must be true in app.json');
        assert.strictEqual(appJson.expo.ios.bundleIdentifier, 'com.infraxpert.sabca', 'Bundle ID mismatch');
    });

    assert(fs.existsSync(pbxprojPath), 'project.pbxproj must exist');
    const pbxproj = fs.readFileSync(pbxprojPath, 'utf8');

    await t.test('Verifies TARGETED_DEVICE_FAMILY = "1,2" in Xcode project (iPhone + iPad)', () => {
        assert(pbxproj.includes('TARGETED_DEVICE_FAMILY = "1,2";'), 'TARGETED_DEVICE_FAMILY must include 1 and 2');
    });

    await t.test('Verifies IPHONEOS_DEPLOYMENT_TARGET is iOS 15.1+', () => {
        assert(pbxproj.includes('IPHONEOS_DEPLOYMENT_TARGET = 15.1;'), 'Deployment target must be 15.1');
    });
});
