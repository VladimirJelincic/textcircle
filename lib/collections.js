/**
 * Created by vladimir on 11/03/16.
 */
// this collection stores all the documents
this.Documents = new Mongo.Collection("documents");
// this collection stores sets of users that are editing documents
EditingUsers = new Mongo.Collection("editingUsers");

Comments=new Mongo.Collection("comments");
//schema used for validation and autoForm generation
Comments.attachSchema(new SimpleSchema({

    title: {
        type: String,
        label: "Title",
        max: 200
    },
    body: {
        type: String,
        label: "Comment",
        max: 1000
    },
    docid: {
        type: String
    },
    owner: {
        type: String
    }

}))