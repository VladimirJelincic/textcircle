// this collection stores all the documents
this.Documents = new Mongo.Collection("documents");
// this collection stores sets of users that are editing documents
EditingUsers = new Mongo.Collection("editingUsers");

if (Meteor.isClient) {
    Meteor.subscribe("documents");
    Meteor.subscribe("editingUsers");
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
                    Meteor.call("addEditingUser");

                });

            }
        }
    });
    Template.editingUsers.helpers({
        users: function () {
            var users, doc, eusers;
            doc = Documents.findOne();
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
    Template.docMeta.helpers({
        document: function () {
            return Documents.findOne({_id: Session.get("docid")});
        },
        canEdit: function(){
            var doc;
            doc=Documents.findOne(({_id:Session.get("docid")}));
            if(doc){
                if(doc.owner==Meteor.userId()){
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
}


if (Meteor.isServer) {
    Meteor.startup(function () {
        // code to run on server at startup
        if (!Documents.findOne()) {
            Documents.insert({title: "my new document"});
        }
    });
    Meteor.publish("documents", function () {
        return Documents.find({
            $or: [
                {isPrivate: false},
                {owner: this.userId}
            ]

        });
    })
    Meteor.publish(("editingUsers", function () {
        return EditingUsers.find();
    }))

}
Meteor.methods({
    addDoc: function () {
        var doc;
        if (!this.userId) {
            return;
        }
        else {
            doc = {
                owner: this.userId,
                createdOn: new Date(),
                title: "my new doc",
                isPrivate: false
            }
            var id = Documents.insert(doc);
            console.log("addDoc method: got an id" + id);
            return id;
        }
    },
    addEditingUser: function () {
        var doc, user, eusers;
        doc = Documents.findOne();
        if (!doc) {
            return;
        }
        if (!this.userId) {
            return;
        }
        user = Meteor.user().profile;
        eusers = EditingUsers.findOne({docid: doc._id});
        if (!eusers) {
            eusers = {
                docid: doc._id,
                users: {}
            };
        }
        user.lastEdit = new Date();
        eusers.users[this.userId] = user;
        EditingUsers.upsert({_id: eusers._id}, eusers);
    },
    "updateDocPrivacy": function (doc) {
        console.log("updateDocPrivacy method")
        console.log(doc);
        var realDoc = Documents.findOne({_id: doc._id, owner: this.userId});
        if (realDoc) {
            realDoc.isPrivate = doc.isPrivate;
            Documents.update({_id: realDoc._id}, realDoc);
        }
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



