const bcrypt = require('bcryptjs');
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
    }
};
