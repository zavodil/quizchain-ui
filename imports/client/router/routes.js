import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { FlowRouterMeta, FlowRouterTitle } from 'meteor/ostrio:flow-router-meta';

// ASK FLOWROUTER TO WAIT AND PULL ALL DYNAMIC DEPENDENCIES
// BEFORE INITIALIZING ROUTER
FlowRouter.wait();
Promise.all([
  import('/imports/client/templates/layout/layout')
]).then(() => {
  FlowRouter.initialize();
}).catch(e => {
  console.error('[Promise.all] loading dynamic imports error:', e);
});

[{
  pathDef: '/',
  options: {
    title: 'Quiz Chain',
    waitOn() {
      return import('/imports/client/templates/home/home');
    },
    action() {
      this.render('mainLayout', 'home');
    }
  },
}, {
  pathDef: '/leaderboard/:quizId',
  options: {
    title: 'Leaderboard',
    name: 'leaderboardRoute',
    waitOn() {
      return import('/imports/client/templates/leaderboard/leaderboard');
    },
    action() {
      this.render('mainLayout', 'leaderboard');
    }
  },
}, {
  pathDef: '/results/:quizId',
  options: {
    title: 'Results',
    name: 'resultsRoute',
    waitOn() {
      return import('/imports/client/templates/results/results');
    },
    action() {
      this.render('mainLayout', 'results');
    }
  },
}, {
  pathDef: '/my-profile',
  options: {
    title: 'My profile',
    waitOn() {
      return import('/imports/client/templates/my-profile/my-profile');
    },
    action() {
      this.render('mainLayout', 'myProfile');
    }
  },
}, {
  pathDef: '/game/:quizId',
  options: {
    title: 'Game',
    name: 'gameRoute',
    waitOn() {
      return import('/imports/client/templates/game/game');
    },
    action(params) {
      this.render('mainLayout', 'game', { params });
    }
  },
}, {
  pathDef: '*',
  options: {
    title: '404: Page not found',
    action() {
      // TODO: RENEDER 404 here
    },
  },
}].forEach(({ pathDef, options }) => FlowRouter.route(pathDef, options));

new FlowRouterMeta(FlowRouter);
new FlowRouterTitle(FlowRouter);
