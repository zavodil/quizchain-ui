import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

const setShowSubtitle = () => {
  import { Session } from 'meteor/session';

  Session.set('showSubtitle', true);
};

const setHideSubtitle = () => {
  import { Session } from 'meteor/session';

  Session.set('showSubtitle', false);
};

// ASK FLOWROUTER TO WAIT AND PULL ALL DYNAMIC DEPENDENCIES
// BEFORE INITIALIZING ROUTER
FlowRouter.wait();
Promise.all([import('/imports/client/templates/layout/layout')])
  .then(() => {
    FlowRouter.initialize();
  })
  .catch(e => {
    console.error('[Promise.all] loading dynamic imports error:', e);
  });

[
  {
    pathDef: '/',
    options: {
      title: 'Home',
      waitOn() {
        return Promise.all([import('/imports/client/templates/home/home')]);
      },
      action() {
        this.render('mainLayout', 'home');
      },
      triggersEnter: [setShowSubtitle],
    },
  },
  {
    pathDef: '/leaderboard/:quizId',
    options: {
      title: 'Leaderboard',
      action() {},
    },
  },
  {
    pathDef: '/results/:quizId',
    options: {
      title: 'Results',
      action() {},
    },
  },
  {
    pathDef: '/my-profile',
    options: {
      title: 'My profile',
      waitOn() {
        return Promise.all([
          import('/imports/client/templates/my-profile/my-profile'),
        ]);
      },
      action() {
        this.render('mainLayout', 'myProfile');
      },
      triggersEnter: [setHideSubtitle],
    },
  },
  {
    pathDef: '/game/:quizId',
    options: {
      title: 'Game',
      waitOn() {
        return Promise.all([import('/imports/client/templates/game/game')]);
      },
      action(params) {
        this.render('mainLayout', 'game', { params });
      },
      triggersEnter: [setHideSubtitle],
    },
  },
  {
    pathDef: '*',
    options: {
      title: '404: Page not found',
      action() {},
    },
  },
].forEach(({ pathDef, options }) => FlowRouter.route(pathDef, options));
