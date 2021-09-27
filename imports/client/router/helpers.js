export const setShowSubtitle = () => {
  import { Session } from 'meteor/session';

  Session.set('showSubtitle', true);
};

export const setHideSubtitle = () => {
  import { Session } from 'meteor/session';

  Session.set('showSubtitle', false);
};
