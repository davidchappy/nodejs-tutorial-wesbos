const mongoose = require('mongoose');
const User = mongoose.model('User');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter: function(req, file, next){
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: "That filetype isn't allowed!"}, false);
    }
  }
}

exports.homePage = (req, res) => {
  res.render('index', {
    title: 'Home'
  });
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: `Add Store` });
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async(req, res, next) => {
  // check if there is no new file to resize
  if( !req.file ) {
    next(); // skip to the next middleware
    return;
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  // once written to file system, keep going
  next();
}

exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
  const store = await (new Store(req.body)).save();
  req.flash('success', `Sucessfully Created ${store.name}. Care to leave a review?`);
  res.redirect(`/stores/${store.slug}`);
};

exports.getStores = async (req, res) => {
  const page = req.params.page || 1;
  const limit = 4;
  const skip = (page * limit) - limit;

  const storesPromise = Store
    .find().populate('reviews')
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' })
  const countPromise = Store.count();

  const [stores, count] = await Promise.all([storesPromise, countPromise]);
  const pages = Math.ceil(count / limit);
  if (!stores.length && skip) {
    req.flash('info', `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`);
    res.redirect(`/stores/page/${pages}`);
    return;
  }
  res.render('stores', { title: 'Stores', stores, count, pages, page });
};

const confirmOwner = (store, req, res) => {
  if (!store.author.equals(req.user._id)) {
    req.flash('error', 'You must own a store in order to edit it!');
    return res.redirect('back');
  }
}

exports.editStore = async (req, res) => {
  const store = await Store.findOne({ _id: req.params.id });
  // Add authentication here
  confirmOwner(store, req, res);
  res.render('editStore', { title: `Edit ${store.name}`, store });
}

exports.updateStore = async (req, res) => {
  req.body.location.type = 'Point';
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body,
    {
      new: true,
      runValidators: true
    }
  ).exec();
  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store →</a>`);
  res.redirect(`/stores/${store._id}/edit`);
}

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug }).populate('author reviews');
  if (!store) return next();
  res.render('store', { store, title: store.name });
}

exports.getStoresByTag = async (req, res, next) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true };
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  const results = await Promise.all([ tagsPromise, storesPromise ]);
  const [tags, stores] = [...results];

  res.render('tags', { tags, title: 'Tags', tag, stores });
}

exports.searchStores = async (req, res) => {
  const stores = await Store
  // First find all stores matching query
  .find({
    $text: {
      $search: req.query.q
    }
  }, {
    score: { $meta: 'textScore' }
  })
  // Sort by score/relevance
  .sort({
    score: { $meta: 'textScore' }
  })
  // Limit to only 5 stores
  .limit(5);
  res.json(stores);
}

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 10000 // 10km
      }
    }
  };

  const stores = await Store.find(q).select('slug name description location photo').limit(10);
  res.json(stores);
}

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
}

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User
  .findByIdAndUpdate(req.user._id,
    { [operator]: { hearts: req.params.id }},
    { new: true }
  );
  res.json(user);
}

exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores();
  res.render('topStores', { stores, title: '⭐ Top Stores!'} );
}