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
    name: 'home',
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
    name: 'leaderboard',
    waitOn() {
      return import('/imports/client/templates/leaderboard/leaderboard');
    },
    action(params) {
      this.render('mainLayout', 'leaderboard', { params });
    }
  },
}, {
  pathDef: '/referrals/:quizId',
  options: {
    title: 'Referrals',
    name: 'referrals',
    waitOn() {
      return import('/imports/client/templates/referrals/referrals');
    },
    action(params) {
      this.render('mainLayout', 'referrals', { params });
    }
  },
}, {
  pathDef: '/quiz/:quizId',
  options: {
    title: 'Quiz',
    name: 'quiz',
    waitOn() {
      return import('/imports/client/templates/home/home');
    },
    action(params) {
      this.render('mainLayout', 'home', { params });
    }
  },
}, {
  pathDef: '/answers/:quizId',
  options: {
    title: 'Answers',
    name: 'answers',
    waitOn() {
      return import('/imports/client/templates/answers/answers');
    },
    action(params) {
      this.render('mainLayout', 'answers', { params });
    }
  },
}, {
  pathDef: '/results/:quizId',
  options: {
    title: 'Results',
    name: 'results',
    waitOn() {
      return import('/imports/client/templates/results/results');
    },
    action(params) {
      this.render('mainLayout', 'results', { params });
    }
  },
}, {
  pathDef: '/create',
  options: {
    title: 'Create Quiz',
    name: 'create',
    waitOn() {
      return import('/imports/client/templates/create/create');
    },
    action() {
      this.render('mainLayout', 'create');
    }
  },
}, {
  pathDef: '/profile',
  options: {
    title: 'My profile',
    name: 'profile',
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
    name: 'game',
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
