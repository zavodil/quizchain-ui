import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import './layout.html';
import './layout.css';

Template.registerHelper('isLoggedIn', () => {
  return Meteor.user();
});

Template.mainLayout.helpers({
  showSubtitle: () => Session.get('showSubtitle'),
});

Template.mainLayout.events({
  'click .title': () => {
    import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

    FlowRouter.go('/');
  },
  'click #username-circle': () => {
    import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

    FlowRouter.go('/my-profile');
  },
});
