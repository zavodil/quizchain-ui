import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import {
  FlowRouterMeta,
  FlowRouterTitle,
} from 'meteor/ostrio:flow-router-meta';

// Set default JS and CSS for all routes
FlowRouter.globals.push({
  link: {
    twbs: {
      rel: 'stylesheet',
      href: 'https://cdn.jsdelivr.net/npm/bootswatch@5.1.1/dist/zephyr/bootstrap.css',
    },
    icons: {
      rel: 'stylesheet',
      href: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/font/bootstrap-icons.css',
    },
  },
  script: {
    twbs: 'https://cdn.jsdelivr.net/npm/bootstrap@5.1.1/dist/js/bootstrap.bundle.min.js',
  },
});

new FlowRouterMeta(FlowRouter);
new FlowRouterTitle(FlowRouter);
