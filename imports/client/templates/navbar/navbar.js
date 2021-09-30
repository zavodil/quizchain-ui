import { app } from '/imports/client/app.js';
import { Template } from 'meteor/templating';
import './navbar.html';

Template.navbar.helpers({
  usernameFirstLetter() {
    const user = app.user.get();
    if (user?.accountId) {
      return user.accountId[0].toUpperCase();
    }
    return '⚙️';
  }
});
