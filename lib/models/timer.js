import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Timer schema for Shopify countdown timers.
 * - Supports multiple stores identified by their domain (storeDomain)
 * - productId is stored as string to accommodate large Shopify IDs
 * - startTime / endTime are Date objects
 * - message: text displayed to customers
 * - styles: free-form object for color/size/position etc.
 * - urgencyMinutes: when to trigger urgency UI before endTime
 */
const TimerSchema = new Schema(
  {
    storeDomain: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    productId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
      validate: {
        validator: function (v) {
          // endTime must be after startTime
          return !this.startTime || !v || v > this.startTime;
        },
        message: "endTime must be after startTime",
      },
    },
    message: {
      type: String,
      trim: true,
      default: "",
    },
    styles: {
      // Allow arbitrary JSON for styling (colors, size, position, classes)
      type: Schema.Types.Mixed,
      default: {},
    },
    urgencyMinutes: {
      // Number of minutes before endTime to trigger urgency UI
      type: Number,
      default: 5,
      min: 0,
    },
    active: {
      // Whether the timer is currently enabled (merchant-controlled)
      type: Boolean,
      default: true,
      index: true,
    },
    metadata: {
      // Optional place for app-specific metadata
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index to speed queries for a store's timers on a product
TimerSchema.index({ storeDomain: 1, productId: 1 });

// Optional: find active timers for a product that are currently running
TimerSchema.statics.findActiveForProduct = function (storeDomain, productId, now = new Date()) {
  return this.find({
    storeDomain,
    productId: String(productId),
    active: true,
    startTime: { $lte: now },
    endTime: { $gte: now },
  }).sort({ endTime: 1 });
};

const Timer = mongoose.models.Timer || mongoose.model("Timer", TimerSchema);

export default Timer;
