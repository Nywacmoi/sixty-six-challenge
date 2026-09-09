/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'Défi99Widget',
  displayName: 'Défi 99',
  icon: '../../assets/icon.png',
  entitlements: {
    'com.apple.security.application-groups': ['group.com.nywacmoi.defi99'],
  },
});
