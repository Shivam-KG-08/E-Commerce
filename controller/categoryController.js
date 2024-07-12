const CustomError = require("../utility/CustomError");
const { Subcategory, Category, Brand } = require("../model/categoryModel");

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

