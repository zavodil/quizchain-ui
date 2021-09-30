import { app } from '/imports/client/app.js';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Template } from 'meteor/templating';
import './my-profile.html';

Template.myProfile.onCreated(function () {
  if (!app._account) {
    FlowRouter.go('home');
  }
});

Template.myProfile.events({
  'click [data-logout]'(e) {
    e.preventDefault();
    app.wallet.signOut();
    window.location.href = '/';
    return false;
  }
});
