const mongoose = require('mongoose');

const User = require('./models/User');

require('dotenv').config();



async function createAdmin() {

  try {

    await mongoose.connect(process.env.MONGODB_URI);



    const admin = new User({

      name: 'Admin User',

      email: 'admin@bomassstore.com',

      password: 'admin123456', // Change this!

      phone: '+2348012345678',

      role: 'admin',

      isVerified: true

    });



    await admin.save();

    console.log('✅ Admin user created successfully!');

    console.log('Email: admin@bomassstore.com');

    console.log('Password: admin123456');

    process.exit(0);

  } catch (error) {

    console.error('❌ Error creating admin:', error.message);

    process.exit(1);

  }

}



createAdmin();

