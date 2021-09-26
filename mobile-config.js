App.info({
  name: 'Near quiz chain',
  description: 'Play quiz and earn crypto',
});

App.appendToConfig(`
<edit-config file="app/src/main/AndroidManifest.xml" mode="merge" target="/manifest/application" xmlns:android="http://schemas.android.com/apk/res/android">
    <application android:usesCleartextTraffic="true"></application>
</edit-config>
`);
