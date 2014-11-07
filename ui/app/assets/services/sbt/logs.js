/*
 Copyright (C) 2014 Typesafe, Inc <http://typesafe.com>
 */
define([
  'commons/websocket',
  './tasks',
  './app'
], function(
  websocket,
  tasks,
  app
) {

  var logs = ko.observableArray([]);
  var stdout = ko.observableArray([]);

  // Websocket Handlers
  var logEvent = websocket.subscribe("type", "sbt");

  /**
  Logs, by execution/task
  */
  logEvent.matchOnAttribute("subType", "TaskLogEvent").filter(filterDebug).map(function(m) {
    if (m.event.taskId) {
      m.executionId = tasks.findExecutionIdByTaskId(m.event.taskId);
    }
    return m;
  }).each(function(m) {
    logs.push(m);
  });

  logEvent.matchOnAttribute("subType", "CoreLogEvent").filter(filterDebug).each(function(m) {
    logs.push(m);
  });

  function filterDebug(m) {
    if (m.event.entry && m.event.entry.level)
      return m.event.entry.level !== "debug" || (app.settings.showLogDebug() || debug);
    else
      return true;
  }

  logEvent
    .matchOnAttribute("subType", "BackgroundJobLogEvent")
    .each(pushTo(stdout));

  function pushTo(bucket){
    var buffer = ko.buffer();
    return function(message) {
      buffer(message, function(messages) {
        bucket.push.apply(bucket, messages);
      });
      if(bucket().length > 1000) {
        bucket.splice(0,100); // Remove the first 100 items
      }
    }
  }

  return {
    logs: logs,
    stdout: stdout
  }

});
