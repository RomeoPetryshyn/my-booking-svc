const express = require('express');
const bodyParser = require('body-parser');
const { graphqlHTTP } = require('express-graphql');
const {buildSchema} = require('graphql');
const mongoose = require('mongoose');
const {MONGO_DB_NAME, MONGO_PASSWORD} = require('./config.json');
const bcrypt = require('bcryptjs');

const Event = require('./models/event');
const User = require('./models/user');

const app = express();

app.use(bodyParser.json());

const events = (eventIds) => {
    return Event.find({_id: {$in: eventIds}})
        .then(events => {
            return events.map(event => {
                return {
                    ...event._doc,
                    _id: event.id,
                    creator: user.bind(this, event.creator)}
            });
        }).catch(error => {
            throw error;
        });
}

const user = (userId) => {
    return User.findById(userId)
        .then(user => {
            return {
                ...user._doc,
                _id: user.id,
                createdEvents: events.bind(this, user._doc.createdEvents)
            }
        }).catch(error => {
            throw error;
        })
}

app.use('/graphql', graphqlHTTP({
    schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
            creator: User!
        }
        
        type User {
            _id: ID!
            email: String!
            password: String,
            createdEvents: [Event!]
        }
        
        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }
        
        input UserInput {
            email: String!
            password: String!
        }
    
        type RootQuery {
            events: [Event!]!
        }
        
        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
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
                       return {
                           ...event._doc,
                           _id: event.id,
                           creator: user.bind(this, event._doc.creator)
                       }
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
                date: new Date(args.eventInput.date),
                creator: '601f238c6d60563e6536821d'
            });
            let createdEvent = null;
            return event.save().then(result => {
                createdEvent = {...result._doc, _id: result.id, creator: user.bind(this, result._doc.creator)};
                return User.findById('601f238c6d60563e6536821d');
            }).then(user => {
                if (user) {
                    user.createdEvents.push(event);
                    return user.save();
                } else {
                    throw new Error('User does not exist');
                }
            }).then(result => {
                return createdEvent;
            }).catch(error => {
                throw error;
            });
        },
        createUser: async (args) => {
            await User.findOne({email: args.userInput.email}).then(user => {
                if (user) {
                    throw new Error('User already exists');
                }
            });
            let hashedPassword;
            try {
                hashedPassword = await bcrypt.hash(args.userInput.password, 12);
            } catch (error) {
                console.error('Failed hashing password');
                throw error;
            }
            const user = new User({
                email: args.userInput.email,
                password: hashedPassword
            });
            return user.save().then(result => {
                return {...result._doc, password: null, _id: result.id};
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
