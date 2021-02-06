const express = require('express');
const bodyParser = require('body-parser');
const { graphqlHTTP } = require('express-graphql');
const {buildSchema} = require('graphql');
const mongoose = require('mongoose');
const {MONGO_DB_NAME, MONGO_PASSWORD} = require('./config.json');

const Event = require('./models/event');

const app = express();

app.use(bodyParser.json());

app.use('/graphql', graphqlHTTP({
    schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
        }
        
        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }
    
        type RootQuery {
            events: [Event!]!
        }
        
        type RootMutation {
            createEvent(eventInput: EventInput): Event
        }
    
        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        events: () => {
            return Event.find()
                .then(events => {
                   return events.map(event => {
                       return {...event._doc, _id: event.id}
                   })
                })
                .catch(error => {
                    throw error
                });
        },
        createEvent: (args) => {
            const event = new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: +args.eventInput.price,
                date: new Date(args.eventInput.date)
            });
            return event.save().then(result => {
                return {...result._doc, _id: result.id};
            }).catch(error => {
                throw error;
            });
        }
    },
    graphiql: true
}));

mongoose.connect(`mongodb+srv://mongo-db-admin-1:${MONGO_PASSWORD}@cluster0.nhvzi.mongodb.net/${MONGO_DB_NAME}?retryWrites=true&w=majority`)
    .then(() => {
        app.listen(3000);
    })
    .catch((error) => {
        console.error(error);
    });
