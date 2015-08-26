Tasks = new Mongo.Collection("tasks");

/////////////////////////
// SERVER DATA PUBLISH // 
/////////////////////////

if (Meteor.isServer) {
	// This code only runs on the server
	Meteor.publish("tasks", function () {
		return Tasks.find({
			$or: [
				{ private: {$ne: true} },
				{ owner: this.userId }
			]
		});
	});
}

////////////////////
// CLIENT METHODS // 
////////////////////

if (Meteor.isClient) {

	Meteor.subscribe("tasks");

	Template.body.helpers({
		tasks: function() {
			if (Session.get("hideCompleted")) {
				// If hide completed is checked filter the tasks
				return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
			} else {
				return Tasks.find({}, {sort: {createdAt: -1}});
			}
		},
		hideCompleted: function() {
			return Session.get("hideCompleted");
		},
		incompleteCount: function() {
			return Tasks.find({checked: {$ne: true}}).count();
		}

	});

	Template.body.events({
		"submit .new-task": function(event) {
			// Prevent default browser form submit
			event.preventDefault();

			// Get value from form element
			var text = event.target.text.value;

			// Insert task into the collection
			Meteor.call("addTask", text);

			// Clear form
			event.target.text.value = "";

		},
		"change .hide-completed input": function(event) {
			return Session.set("hideCompleted", event.target.checked);
		}

	});

	Accounts.ui.config({
		passwordSignupFields: "USERNAME_ONLY"
	});

	Template.task.helpers({
		isOwner: function () {
			return this.owner === Meteor.userId();
		}
	});

	Template.task.events({
		"click .toggle-checked": function(event) {
			if (Meteor.call("setChecked", this._id, !this.checked)) {
			} else {
				event.target.checked = false;
			}
		},
		"click .delete": function() {
			Meteor.call("deleteTask", this._id);
		},
		"click .toggle-private": function () {
			Meteor.call("setPrivate", this._id, ! this.private);
		}
	});

}

////////////////////
// SERVER METHODS //
////////////////////

Meteor.methods({

	addTask: function(text) {
		if (!Meteor.userId()) {
			throw new Meteor.Error("not-authorized");
		}

		Tasks.insert({
			text: text,
			createdAt: new Date(),
			owner: Meteor.userId(),
			username: Meteor.user().username
		});
	},
	deleteTask: function(taskId) {
		var task = Tasks.findOne(taskId);
		if (task.owner !== Meteor.userId()) {
			throw new Meteor.Error("not-authorized");
		}

		Tasks.remove(taskId);
	},
	setChecked: function(taskId, setChecked) {
		var task = Tasks.findOne(taskId);
		if (task.owner !== Meteor.userId()) {
			throw new Meteor.Error("not-authorized");
		}

		Tasks.update(taskId, {$set: {checked: setChecked}});
	},
	setPrivate: function (taskId, setToPrivate) {
		var task = Tasks.findOne(taskId);
	 
		// Make sure only the task owner can make a task private
		if (task.owner !== Meteor.userId()) {
			throw new Meteor.Error("not-authorized");
		}
	 
		Tasks.update(taskId, { $set: { private: setToPrivate } });
	}
});

// if (Meteor.isServer) {
//   Meteor.startup(function () {
//     // code to run on server at startup
//   });
// }
