const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/user');

module.exports = {
    createUser: async (args) => {
        try {
            const existingUser = await User.findOne({email: args.userInput.email});
            if (existingUser) {
                throw new Error('User already exists');
            }
            const hashedPassword = await bcrypt.hash(args.userInput.password, 12);
            const user = new User({
                email: args.userInput.email,
                password: hashedPassword
            });
            const userSaveResult = await user.save();
            return {
                ...userSaveResult._doc,
                password: null,
                _id: userSaveResult.id
            };
        } catch (error) {
            throw error;
        }
    },
    login: async ({email, password}) => {
        const user = await User.findOne({email: email});
        if (!user) {
            throw new Error('User does not exist');
        }
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            throw new Error('Password is not correct');
        }
        const token = jwt.sign({userId: user.id, email: user.email}, 'superSecretPrivateKey', {
            expiresIn: '1h'
        });
        return {userId: user.id, token, tokenExpiration: 1}
    }
};
