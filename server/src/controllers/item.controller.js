import { Item } from '../models/item.model.js';
import { isDbConnected } from '../config/db.js';

// In-memory fallback dataset for when MongoDB is not currently running
let inMemoryItems = [
  {
    _id: 'mock-1',
    title: 'Initialize MERN Stack Architecture',
    description: 'Set up Vite + React client and Express + MongoDB server with ES Modules.',
    category: 'Development',
    status: 'Completed',
    priority: 'High',
    tags: ['Vite', 'React', 'Express', 'Tailwind'],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    _id: 'mock-2',
    title: 'Configure Tailwind CSS v4',
    description: 'Integrate @tailwindcss/vite with modern CSS-first styling and theme tokens.',
    category: 'Design',
    status: 'Completed',
    priority: 'High',
    tags: ['CSS', 'Tailwindv4', 'DesignSystem'],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: 'mock-3',
    title: 'Connect MongoDB Cluster / Local DB',
    description: 'Provide Mongo URI in server/.env or test live with fallback store.',
    category: 'Development',
    status: 'In Progress',
    priority: 'Medium',
    tags: ['MongoDB', 'Mongoose', 'Database'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * @desc Get all items with optional filtering and search
 * @route GET /api/v1/items
 */
export const getItems = async (req, res, next) => {
  try {
    const { category, status, priority, search } = req.query;

    if (isDbConnected()) {
      const query = {};
      if (category) query.category = category;
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const items = await Item.find(query).sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        count: items.length,
        source: 'mongodb',
        data: items,
      });
    }

    // In-memory fallback
    let results = [...inMemoryItems];
    if (category) results = results.filter((item) => item.category === category);
    if (status) results = results.filter((item) => item.status === status);
    if (priority) results = results.filter((item) => item.priority === priority);
    if (search) {
      const s = search.toLowerCase();
      results = results.filter(
        (item) => item.title.toLowerCase().includes(s) || item.description.toLowerCase().includes(s)
      );
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      source: 'in-memory-fallback',
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get single item by ID
 * @route GET /api/v1/items/:id
 */
export const getItemById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const item = await Item.findById(id);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }
      return res.status(200).json({ success: true, source: 'mongodb', data: item });
    }

    const item = inMemoryItems.find((i) => i._id === id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    return res.status(200).json({ success: true, source: 'in-memory-fallback', data: item });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Create new item
 * @route POST /api/v1/items
 */
export const createItem = async (req, res, next) => {
  try {
    const { title, description, category, status, priority, tags } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    if (isDbConnected()) {
      const newItem = await Item.create({
        title,
        description,
        category: category || 'Development',
        status: status || 'In Progress',
        priority: priority || 'Medium',
        tags: Array.isArray(tags) ? tags : [],
      });

      return res.status(201).json({
        success: true,
        source: 'mongodb',
        data: newItem,
      });
    }

    const newItem = {
      _id: 'item-' + Date.now(),
      title: title.trim(),
      description: description || '',
      category: category || 'Development',
      status: status || 'In Progress',
      priority: priority || 'Medium',
      tags: Array.isArray(tags) ? tags : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryItems.unshift(newItem);

    return res.status(201).json({
      success: true,
      source: 'in-memory-fallback',
      data: newItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update an item
 * @route PUT /api/v1/items/:id
 */
export const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const item = await Item.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }
      return res.status(200).json({ success: true, source: 'mongodb', data: item });
    }

    const index = inMemoryItems.findIndex((i) => i._id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    inMemoryItems[index] = {
      ...inMemoryItems[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      source: 'in-memory-fallback',
      data: inMemoryItems[index],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete an item
 * @route DELETE /api/v1/items/:id
 */
export const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const item = await Item.findByIdAndDelete(id);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }
      return res.status(200).json({ success: true, source: 'mongodb', message: 'Item deleted successfully' });
    }

    const index = inMemoryItems.findIndex((i) => i._id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    inMemoryItems.splice(index, 1);
    return res.status(200).json({
      success: true,
      source: 'in-memory-fallback',
      message: 'Item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
