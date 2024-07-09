const CustomError = require("../utility/CustomError");
const { Subcategory, Category, Brand, Prd } = require("../model/categoryModel");

module.exports.getAllCategory = async (req, res) => {
  try {
    const category = await Category.find({});

    return res.status(200).json({
      status: "Success",
      category,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fails",
      error,
    });
  }
};

module.exports.getCategory = async (req, res) => {
  try {
    const categoryQuery = req.query.category;
    const category = await Category.find({ title: categoryQuery });

    return res.status(200).json({
      status: "Success",
      category,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fails",
      error,
    });
  }
};

module.exports.getSubCat = async (req, res) => {
  try {
    const category = await Subcategory.findById(req.params.id);
    return res.status(200).json({
      status: "Success",
      category,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fails",
      error,
    });
  }
};
module.exports.getBrand = async (req, res) => {
  try {
    const category = await Brand.findById(req.params.id);
    return res.status(200).json({
      status: "Success",
      category,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fails",
      error,
    });
  }
};

module.exports.getAllPrd = async (req, res, next) => {
  try {
    let query = {};
    let limitDoc = req.query.limit;
    if (limitDoc <= 0) {
      return next(new CustomError("Enter valid limit", 400));
    }
    const page = req.query.page;

    if (page <= 0) {
      return next(new CustomError("Invalid page number", 400));
    }
    const offset = (page - 1) * limitDoc;

    if (req.query.price) {
      let queryStr = JSON.stringify(req.query.price);

      queryStr = queryStr.replace(
        /\b(gte|gt|lte|lt)\b/g,
        (match) => `$${match}`
      );

      let queryObj = JSON.parse(queryStr);
      query.price = queryObj;
    }

    if (req.query.category) {
      let cat = await Category.findOne({ title: req.query.category });
      if (cat) {
        query.categoryId = cat.id;
      } else {
        return res.status(404).json({
          status: "Fails",
          message: "Category not found",
        });
      }
    }

    if (req.query.subCategory) {
      let sub = await Subcategory.findOne({ title: req.query.subCategory });
      if (sub) {
        query.subCategoryId = sub.id;
      } else {
        return res.status(404).json({
          status: "Fails",
          message: "Subcategory not found",
        });
      }
    }

    if (req.query.brand) {
      let brd = await Brand.findOne({ name: req.query.brand });
      if (brd) {
        query.brandId = brd.id;
      } else {
        return res.status(404).json({
          status: "Fails",
          message: "Brand not found",
        });
      }
    }

    let srt;

    if (req.query.sort) {
      srt = req.query.sort.split(",").join(" ");
    }

    // console.log(query);
    const product = await Prd.find(query)
      .skip(offset)
      .limit(limitDoc)
      .sort(srt);
    const result = product.length;

    if (product.length == 0) {
      return res.status(404).json({
        status: "Fails",
        message: "Not any product found",
      });
    }

    return res.status(200).json({
      status: "success",
      result,
      product,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fails",
      error,
    });
  }
};

module.exports.getProducts = async (req, res) => {
  try {
    const category = await Prd.findById(req.params.id);
    return res.status(200).json({
      status: "Success",
      category,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fails",
      error,
    });
  }
};

module.exports.createCategory = async (req, res) => {
  try {
    const category = await Category.create({
      title: req.body.title,
    });

    return res.status(201).json({
      status: "Success",
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: fails,
      error,
    });
  }
};

module.exports.createSubcategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return next(new CustomError("Category not found", 404));
    }

    const subCat = await Subcategory.create({
      categoryId: req.params.id,
      title: req.body.title,
    });
    // const sub = category.subCategory;

    // sub.push(subCat);

    // await category.save();

    return res.status(201).json({
      status: "Success",
      message: "Subcategory created successfully",
      subCat,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fails",
      error,
    });
  }
};

module.exports.createBrand = async (req, res, next) => {
  try {
    const subCat = await Subcategory.findById(req.params.id);
    if (!subCat) {
      return next(new CustomError("Sub Category not found", 404));
    }
    const brandCat = await Brand.create({
      subCategoryId: req.params.id,
      name: req.body.name,
    });
    // const sub = subCat.Brand;
    // sub.push(brandCat);

    // await subCat.save();

    // const cat = await Category.findById(subCat.categoryId);
    // const subCategory = cat.subCategory.id(req.params.id);
    // console.log(subCategory);
    // subCategory.Brand.push(brandCat);
    // await cat.save();

    return res.status(201).json({
      status: "Success",
      message: "Brand created successfully",
      brandCat,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fails",
      error,
    });
  }
};

module.exports.createPrd = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);

    const subCate = await Subcategory.findById(brand.subCategoryId);

    if (!brand) {
      return next(new CustomError("Brand not found", 404));
    }
    const prdCat = await Prd.create({
      categoryId: subCate.categoryId,
      subCategoryId: brand.subCategoryId,
      brandId: req.params.id,
      name: req.body.name,
      price: req.body.price,
      quantity: req.body.quantity,
    });
    // const sub = brand.product;

    // sub.push(prdCat);

    // await brand.save();

    // const subCat = await Subcategory.findById(brand.subCategoryId);
    // const brd = subCat.Brand.id(req.params.id);
    // brd.product.push(prdCat);
    // await subCat.save();

    // const cat = await Category.findById(subCat.categoryId);
    // const subCategory = cat.subCategory.id(subCat.id);
    // const prd = subCategory.Brand.id(req.params.id);
    // prd.product.push(prdCat);
    // await cat.save();

    return res.status(201).json({
      status: "Success",
      message: "Product created successfully",
      prdCat,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fails",
      error,
    });
  }
};
