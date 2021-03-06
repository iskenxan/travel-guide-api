import stream from 'getstream';

const { STREAM_KEY, STREAM_SECRET } = process.env;
const client = stream.connect(STREAM_KEY, STREAM_SECRET, '46620', { location: 'us-east' });


const addPostActivity = (username, postId, postTitle, timestamp, postPreface) => {
  const userFeed = client.feed('user', username);
  return userFeed.addActivity({
    actor: username,
    verb: 'post',
    object: postId,
    foreign_id: `post:${postId}`,
    postTitle,
    postPreface,
    timestamp,
  });
};


const removePostActivity = (username, postId) => {
  const userFeed = client.feed('user', username);
  return userFeed.removeActivity({ foreignId: `post:${postId}` });
};


const followUser = (username, following) => {
  const timelineFeed = client.feed('timeline', username);
  timelineFeed.follow('user', following);
};


const unfollowUser = (username, following) => {
  const timelinefeed = client.feed('timeline', username);
  timelinefeed.unfollow('user', following);
};

const addNotification = (username, actor, verb, foreignId, object) => {
  const notificationFeed = client.feed('notifications', username);
  return notificationFeed.addActivity({
    actor,
    verb,
    object,
    foreign_id: foreignId,
    timestamp: new Date().getTime(),
  });
};


const addFollowerNotification = (username, followerUsername) => {
  const foreignId = `${followerUsername}-follow-${username}`;
  return addNotification(username, followerUsername, 'follow', foreignId, foreignId);
};


const getUserClient = (username) => {
  const userToken = client.createUserToken(username);
  return stream.connect(STREAM_KEY, userToken, '46620');
};


const addReaction = (username, authorUsername, type, postId,
  postActivityId, notifyMaker = false) => {
  const userClient = getUserClient(username);

  return userClient.reactions.add(type, postActivityId, {
    actor: username,
    timestamp: new Date().getTime(),
  })
    .then((reactionResult) => {
      if (notifyMaker) {
        addNotification(authorUsername, username, type, postId, postId);
      }
      return reactionResult;
    });
};


const removeFavoriteNotification = (username, reactionId) => {
  return client.reactions.delete(reactionId, (secondResult) => {
    console.log(secondResult);
  });
};

const addFavoriteNotification = (username, authorUsername, postId, postActivityId, notifyMaker) => {
  return addReaction(username, authorUsername, 'like', postId, postActivityId, notifyMaker);
};


const addCommentNotification = (username, authorUsername, postId, postActivityId, notifyMaker) => {
  return addReaction(username, authorUsername, 'comment', postId, postActivityId, notifyMaker);
};


const getTimelineFeed = (username) => {
  const timeLineFeed = client.feed('timeline', username);
  return timeLineFeed.get({
    limit: 25,
    enrich: true,
    reactions: {
      counts: true,
    },
  }).then((result) => {
    return result;
  });
};


const removePostNotifications = (author, postId) => {
  const notificationFeed = client.feed('notifications', author);
  return notificationFeed.removeActivity({ foreignId: postId });
};


const getNotificationFeed = (username) => {
  const notificationFeed = client.feed('notifications', username);
  return notificationFeed.get({ limit: 200, mark_seen: true }).then((result) => {
    return result;
  });
};


const subscribeToNotification = (username, callback) => {
  const notificationFeed = client.feed('notifications', username);

  return notificationFeed.subscribe(callback);
};


module.exports = {
  addPostActivity,
  removePostActivity,
  addFollowerNotification,
  addFavoriteNotification,
  addCommentNotification,
  followUser,
  unfollowUser,
  getTimelineFeed,
  getNotificationFeed,
  removeFavoriteNotification,
  removePostNotifications,
  subscribeToNotification,
};
