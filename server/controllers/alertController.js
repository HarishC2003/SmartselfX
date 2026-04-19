import Alert from '../models/Alert.js';
import Product from '../models/Product.js';

export const getAlerts = async (req, res, next) => {
  try {
    const filter = { isDismissed: false }

    // VENDOR: only sees alerts targeted at VENDOR role for their assigned products
    if (req.user.role === 'VENDOR') {
      const vendorProducts = await Product.find(
        { vendorId: req.user.id },
        '_id'
      )
      const productIds = vendorProducts.map(p => p._id)
      filter.productId = { $in: productIds }
      filter.targetRoles = 'VENDOR'
    } else {
      // ADMIN/MANAGER: only see alerts targeted at their role
      filter.targetRoles = req.user.role
    }

    if (req.query.type)     filter.type = req.query.type
    if (req.query.severity) filter.severity = req.query.severity
    if (req.query.isRead !== undefined) {
      filter.isRead = req.query.isRead === 'true'
    }

    const page  = parseInt(req.query.page)  || 1
    const limit = parseInt(req.query.limit) || 20
    const skip  = (page - 1) * limit

    const [alerts, total, unreadCount] = await Promise.all([
      Alert.find(filter)
        .populate('productId', 'name sku imageUrl currentStock')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Alert.countDocuments(filter),
      Alert.countDocuments({ ...filter, isRead: false })
    ])

    res.status(200).json({ alerts, unreadCount, pagination: {
      total, page, limit, totalPages: Math.ceil(total / limit)
    }})
  } catch (error) {
    if (next) next(error)
    else res.status(500).json({ message: 'Error fetching alerts', error: error.message })
  }
}

export const markAlertRead = async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id);
        if (!alert) return res.status(404).json({ message: 'Alert not found' });

        alert.isRead = true;
        await alert.save();

        res.status(200).json({ message: 'Alert marked as read', alert });
    } catch (error) {
        res.status(500).json({ message: 'Error updating alert', error: error.message });
    }
};

export const markAllAlertsRead = async (req, res) => {
    try {
        let filter = { isDismissed: false, isRead: false };
        if (req.user.role !== 'VENDOR') {
            filter.targetRoles = req.user.role;
        }

        const result = await Alert.updateMany(filter, { $set: { isRead: true } });

        res.status(200).json({ message: 'All alerts marked as read', count: result.modifiedCount });
    } catch (error) {
        res.status(500).json({ message: 'Error updating alerts', error: error.message });
    }
};

export const dismissAlert = async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id);
        if (!alert) return res.status(404).json({ message: 'Alert not found' });

        alert.isDismissed = true;
        alert.resolvedAt = new Date();
        await alert.save();

        res.status(200).json({ message: 'Alert dismissed', alert });
    } catch (error) {
        res.status(500).json({ message: 'Error dismissing alert', error: error.message });
    }
};

export const getAlertCount = async (req, res) => {
    try {
        let query = { isRead: false, isDismissed: false };

        if (req.user.role === 'VENDOR') {
            const vendorProducts = await Product.find({ vendorId: req.user.id }).select('_id');
            query.productId = { $in: vendorProducts.map(p => p._id) };
        } else {
            query.targetRoles = req.user.role;
        }

        const unreadCount = await Alert.countDocuments(query);
        res.status(200).json({ unreadCount });
    } catch (error) {
        res.status(500).json({ message: 'Error counting alerts', error: error.message });
    }
};
