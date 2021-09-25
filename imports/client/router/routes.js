import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

[
  {
    pathDef: '/',
    options: {
      title: 'Home',
      action() {},
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
