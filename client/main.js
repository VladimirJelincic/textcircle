/**
 * Created by vladimir on 11/03/16.
 */

Meteor.subscribe("documents");
Meteor.subscribe("editingUsers");
Meteor.subscribe("comments");

Router.configure({
    layoutTemplate: 'ApplicationLayout'
});
Router.route('/',function(){
    console.log("you hit /");
    this.render("navbar",{to:"header"});
    this.render("docList",{to:"main"});
});
Router.route('/documents/:_id',function(){
    console.log("you hit /documents"+this.params._id);
    Session.set("docid",this.params._id);
    this.render("navbar",{to:"header"});
    this.render("docItem",{to:"main"});
});
// return the id of the first document you can find
Template.editor.helpers({
    docid: function () {
        setupCurrentDocument();
        return Session.get("docid");

    },
    config: function () {
        return function (editor) {
            editor.setOption("lineNumbers", true);
            editor.setOption("theme", "cobalt");
            editor.on("change", function (cm_editor, info) {
                console.log(cm_editor.getValue());
                $("#viewer_iframe").contents().find("html").html(cm_editor.getValue());
                Meteor.call("addEditingUser",Session.get("docid"));

            });

        }
    }
});
Template.editingUsers.helpers({
    users: function () {
        var users, doc, eusers;
        doc = Documents.findOne({_id:Session.get("docid")});
        if (!doc) {
            return;
        }
        eusers = EditingUsers.findOne({docid: doc._id});
        if (!eusers) {
            return;
        }
        users = new Array();
        var i = 0;
        for (var user_id in eusers.users) {
            users[i] = fixObjectKeys(eusers.users[user_id]);
            i++;
        }
        return users;
    }

})
Template.navbar.helpers({
    documents: function () {
        return Documents.find();
    }
})
Template.commentList.helpers({
    comments: function(){
        return Comments.find({docid:Session.get("docid")});
    }
})
Template.docList.helpers({
    documents: function () {
        return Documents.find();
    }
})
Template.insertCommentForm.helpers({
    docid: function(){
        return Session.get("docid");
    }
})
Template.docMeta.helpers({
    document: function () {
        return Documents.findOne({_id: Session.get("docid")});
    },
    canEdit: function () {
        var doc;
        doc = Documents.findOne(({_id: Session.get("docid")}));
        if (doc) {
            if (doc.owner == Meteor.userId()) {
                return true;
            }
        }
        return false;
    }
})

Template.editableText.helpers({
    userCanEdit: function (doc, Collection) {
        // can edit if the current doc is owned by me
        doc = Documents.findOne({_id: Session.get("docid"), owner: Meteor.userId()});
        if (doc) {
            return true;
        } else {
            return false;
        }

    }
})
///Events
Template.navbar.events({
    "click .js-load-doc": function (event) {
        console.log(this);
        Session.set("docid", this._id);
    },
    "click .js-add-doc": function (event) {
        event.preventDefault();
        console.log("Add a new doc!");
        if (!Meteor.user()) {
            alert("You need to login first");
        } else {
            var id = Meteor.call("addDoc", function (err, res) {
                if (!err) {
                    console.log("event callback got an id back:" + res);
                    Session.set("docid", res)
                }
            });

        }
    }
})
Template.docMeta.events({
    "click .js-tog-private": function () {
        console.log(event.target.checked);
        var doc = {_id: Session.get("docid"), isPrivate: event.target.checked};
        Meteor.call("updateDocPrivacy", doc)


    }
})

// this renames object keys by removing hyphens to make the compatible
// with spacebars.
function fixObjectKeys(obj) {
    var newObj = {};
    for (key in obj) {
        var key2 = key.replace("-", "");
        newObj[key2] = obj[key];
    }
    return newObj;
}


function setupCurrentDocument() {
    var doc;
    if (!Session.get("docid")) {
        doc = Documents.findOne();
        if (doc) {
            Session.set("docid", doc._id);
        }
    }
}

