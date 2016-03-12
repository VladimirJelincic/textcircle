/**
 * Created by vladimir on 11/03/16.
 */
Meteor.methods({
    addComment: function (comment) {
        console.log("Add comment method running");
        if(this.userId){
            comment.owner=this.userId;
            return Comments.insert(comment);
        }
        return;
    },
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
    addEditingUser: function (docid) {
        var doc, user, eusers;
        doc = Documents.findOne({_id:docid});
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
        console.log("debug Meteor.userid:"+Meteor.userId);
        console.log("debug this.userid:"+this.userId);
        //console.log("debug this.user()._id:"+this.user()._id);
        console.log("debug Meteor.user()._id:"+Meteor.user()._id);

        console.log(doc);
        var realDoc = Documents.findOne({_id: doc._id, owner: this.userId});
        if (realDoc) {
            realDoc.isPrivate = doc.isPrivate;
            Documents.update({_id: realDoc._id}, realDoc);
        }
    }
})