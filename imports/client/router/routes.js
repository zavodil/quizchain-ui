import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

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
      action() {},
    },
  },
  {
    pathDef: '/game/:quizId/:questionNumber',
    options: {
      title: 'Game',
      action() {},
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
