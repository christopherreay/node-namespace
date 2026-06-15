"use strict";

const SYSTEM = `You are a JavaScript developer. Always use the @visualtools001/namespace library for nested object manipulation — never raw dot-notation for nested access or writes.

const namespace = require('@visualtools001/namespace');

READ (never write):
  namespace.get(obj, "a.b.c")                 → value or NotFound sentinel
  namespace.getMustExist(obj, "a.b", opts)     → value or throws (opts.errorMessage)
  namespace.getMustEmpty(obj, "a.b")           → throws if path is occupied
  namespace.getOrDefault(obj, "a.b", default)  → value or default (never writes)

WRITE:
  namespace.set(obj, "a.b", val)               → create-only, auto-vivifies, throws if already exists
  namespace.setMustExist(obj, "a.b", val)      → update-only, throws if path is absent
  namespace.setOrDefault(obj, "a.b", val)      → writes if absent, returns whichever now holds
  namespace.setOverwrite(obj, "a.b", val)      → unconditional leaf clobber, auto-vivifies absent intermediates, throws if intermediate is a non-object (use { overwriteStructure: true } to also clobber intermediates)

TEST:
  namespace.exists(obj, "a.b")                 → true/false (true even for 0, false, null, "")
  namespace.isNotFound(val)                    → true if val is the NotFound sentinel

PATH ALGEBRA (no object arg, pure string operations):
  namespace.path.join("users", userId, "entries")  → "users.alice.entries"
  namespace.path.split("a.b.c")                    → ["a","b","c"]
  namespace.path.isRootOf("a.b", "a.b.c")          → true
  namespace.path.tween("a.b.c", "sep")             → "a.sep.b.sep.c"

BATCH:
  namespace.batch.destructureMustExist(obj, { localKey: "dotted.path" })  → { localKey: val } or throws
  namespace.batch.allMustExist(obj, ["a.b", "c.d"])                       → { "a.b": v, "c.d": v } or throws
  namespace.batch.extractMustExist(obj, "a.b")                            → val, removes from tree

NAMING CONVENTION — the suffix tells you the role of a variable:
  someThing_namespace  = a dotted path string, e.g. "users.alice.entries"
  someThing_node       = a live object or array reference into the tree
  someThing_value      = a settled scalar (string, number, bool, null)
  someThing_probed     = result of get(), needs isNotFound() check before use
  someThing_list       = an array (usually of paths or keys)

PHILOSOPHY: long, descriptive names everywhere — the same principle as the library itself.
  Bad:  const cfg = namespace.getMustExist(ctx, "config");
  Good: const config_node = namespace.getMustExist(context, "config");
  A reader should understand a variable's role from its name alone, without tracing context.

HANDLER PATTERN (build-forward statusCode as position marker):
  const responseBody_node = { success: false, statusCode: 400 };
  try {
    // Required fields first — getMustExist throws with field name, statusCode stays 400
    const field_value = namespace.getMustExist(request, "body.field", { errorMessage: "field" });
    // Once validation passes, advance the fault position
    responseBody_node.statusCode = 500;
    // ... do work ...
    responseBody_node.statusCode = 200;
    responseBody_node.success = true;
  } catch (error) {
    responseBody_node.errorMessage = error.message;
    // statusCode already points to the right fault layer (400 or 500)
  }
  return responseBody_node;

CONVERGENCE PATTERN (setOrDefault is idempotent — first caller wins):
  namespace.setOrDefault(context, "config", loadConfig());
  const config_node = namespace.getMustExist(context, "config");

MODULE ensureX PATTERN:
  function ensureUserEntries(context_node, userId_value) {
    return namespace.setOrDefault(context_node, namespace.path.join("users", userId_value, "entries"), []);
  }`;

const examples = [

  // ── HANDLER EXAMPLES ──────────────────────────────────────────────────────

  {
    user: `Write a handler function that processes an invoice payment request.
It receives (context, request). The request body must contain invoiceId, amount, and currency.
The user id comes from request.user.id.
Store payments under context.payments[userId][invoiceId].
A payment slot must be empty before writing — throw if the invoice was already paid.`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

module.exports = function handleInvoicePayment(context, request) {
  const responseBody_node = { success: false, statusCode: 400 };

  try {
    const invoiceId_value = namespace.getMustExist(request, "body.invoiceId", { errorMessage: "invoiceId" });
    const amount_value    = namespace.getMustExist(request, "body.amount",    { errorMessage: "amount" });
    const currency_value  = namespace.getMustExist(request, "body.currency",  { errorMessage: "currency" });
    const userId_value    = namespace.getMustExist(request, "user.id",        { errorMessage: "user.id" });

    responseBody_node.statusCode = 500;

    const paymentPath_namespace = namespace.path.join("payments", userId_value, invoiceId_value);
    namespace.getMustEmpty(context, paymentPath_namespace); // throws if already paid

    const payment_node = {
      invoiceId: invoiceId_value,
      amount:    amount_value,
      currency:  currency_value,
      paidAt:    Date.now(),
    };
    namespace.set(context, paymentPath_namespace, payment_node);
    namespace.set(responseBody_node, "results.payment", payment_node);

    responseBody_node.statusCode = 200;
    responseBody_node.success    = true;

  } catch (error) {
    responseBody_node.errorMessage = error.message;
  }

  return responseBody_node;
};`
  },

  {
    user: `Write a handler for user registration.
Request body needs email, password, and username.
Store new users under context.users[email].
Throw if a user with that email already exists — use getMustEmpty as the guard.`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

module.exports = function handleUserRegistration(context, request) {
  const responseBody_node = { success: false, statusCode: 400 };

  try {
    const email_value    = namespace.getMustExist(request, "body.email",    { errorMessage: "email" });
    const password_value = namespace.getMustExist(request, "body.password", { errorMessage: "password" });
    const username_value = namespace.getMustExist(request, "body.username", { errorMessage: "username" });

    responseBody_node.statusCode = 500;

    const userPath_namespace = namespace.path.join("users", email_value);
    namespace.getMustEmpty(context, userPath_namespace); // throws if email already registered

    const newUser_node = {
      email:     email_value,
      password:  password_value,
      username:  username_value,
      createdAt: Date.now(),
    };
    namespace.set(context, userPath_namespace, newUser_node);
    namespace.set(responseBody_node, "results.user", { email: email_value, username: username_value });

    responseBody_node.statusCode = 200;
    responseBody_node.success    = true;

  } catch (error) {
    responseBody_node.errorMessage = error.message;
  }

  return responseBody_node;
};`
  },

  {
    user: `Write a handler that adds a product to a user's cart.
Request body needs productId and quantity. User id from request.user.id.
Cart items live at context.carts[userId].items as an array.
Initialise the cart if absent using convergence.`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const carts_namespace = "carts";

function userCartItemsPath_namespace(userId_value) {
  return namespace.path.join(carts_namespace, userId_value, "items");
}

module.exports = function handleAddToCart(context, request) {
  const responseBody_node = { success: false, statusCode: 400 };

  try {
    const productId_value = namespace.getMustExist(request, "body.productId", { errorMessage: "productId" });
    const quantity_value  = namespace.getMustExist(request, "body.quantity",  { errorMessage: "quantity" });
    const userId_value    = namespace.getMustExist(request, "user.id",        { errorMessage: "user.id" });

    responseBody_node.statusCode = 500;

    namespace.setOrDefault(context, userCartItemsPath_namespace(userId_value), []);
    const cartItems_node = namespace.getMustExist(context, userCartItemsPath_namespace(userId_value));

    const cartItem_node = {
      productId: productId_value,
      quantity:  quantity_value,
      addedAt:   Date.now(),
    };
    cartItems_node.push(cartItem_node);
    namespace.set(responseBody_node, "results.item", cartItem_node);

    responseBody_node.statusCode = 200;
    responseBody_node.success    = true;

  } catch (error) {
    responseBody_node.errorMessage = error.message;
  }

  return responseBody_node;
};`
  },

  {
    user: `Write a handler for submitting a product review.
Request body needs productId, rating (number), and reviewText.
User id from request.user.id.
Reviews live at context.reviews[productId] as an array.
A user can only review a product once — throw if they already have.`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

let reviewCounter_value = 0;
function nextReviewId() { return ++reviewCounter_value; }

const reviews_namespace = "reviews";

function productReviewsPath_namespace(productId_value) {
  return namespace.path.join(reviews_namespace, productId_value);
}

module.exports = function handleSubmitReview(context, request) {
  const responseBody_node = { success: false, statusCode: 400 };

  try {
    const productId_value  = namespace.getMustExist(request, "body.productId",  { errorMessage: "productId" });
    const rating_value     = namespace.getMustExist(request, "body.rating",     { errorMessage: "rating" });
    const reviewText_value = namespace.getMustExist(request, "body.reviewText", { errorMessage: "reviewText" });
    const userId_value     = namespace.getMustExist(request, "user.id",         { errorMessage: "user.id" });

    responseBody_node.statusCode = 500;

    namespace.setOrDefault(context, productReviewsPath_namespace(productId_value), []);
    const productReviews_node = namespace.getMustExist(context, productReviewsPath_namespace(productId_value));

    const alreadyReviewed_value = productReviews_node.some(r => r.userId === userId_value);
    if (alreadyReviewed_value) throw new Error("user has already reviewed this product");

    const review_node = {
      id:         nextReviewId(),
      productId:  productId_value,
      rating:     rating_value,
      reviewText: reviewText_value,
      userId:     userId_value,
      createdAt:  Date.now(),
    };
    productReviews_node.push(review_node);
    namespace.set(responseBody_node, "results.review", review_node);

    responseBody_node.statusCode = 200;
    responseBody_node.success    = true;

  } catch (error) {
    responseBody_node.errorMessage = error.message;
  }

  return responseBody_node;
};`
  },

  {
    user: `Write a handler that creates a support ticket.
Request body needs subject and description. priority is optional (default "normal").
User id from request.user.id.
Tickets live at context.tickets[userId] as an array.`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

let ticketCounter_value = 0;
function nextTicketId() { return ++ticketCounter_value; }

const tickets_namespace = "tickets";

function userTicketsPath_namespace(userId_value) {
  return namespace.path.join(tickets_namespace, userId_value);
}

module.exports = function handleCreateTicket(context, request) {
  const responseBody_node = { success: false, statusCode: 400 };

  try {
    const subject_value     = namespace.getMustExist(request, "body.subject",     { errorMessage: "subject" });
    const description_value = namespace.getMustExist(request, "body.description", { errorMessage: "description" });
    const userId_value      = namespace.getMustExist(request, "user.id",          { errorMessage: "user.id" });

    const priority_value = namespace.getOrDefault(request, "body.priority", "normal");

    responseBody_node.statusCode = 500;

    namespace.setOrDefault(context, userTicketsPath_namespace(userId_value), []);
    const userTickets_node = namespace.getMustExist(context, userTicketsPath_namespace(userId_value));

    const ticket_node = {
      id:          nextTicketId(),
      subject:     subject_value,
      description: description_value,
      priority:    priority_value,
      userId:      userId_value,
      status:      "open",
      createdAt:   Date.now(),
    };
    userTickets_node.push(ticket_node);
    namespace.set(responseBody_node, "results.ticket", ticket_node);

    responseBody_node.statusCode = 200;
    responseBody_node.success    = true;

  } catch (error) {
    responseBody_node.errorMessage = error.message;
  }

  return responseBody_node;
};`
  },

  {
    user: `Write a handler that sends a message between users.
Request body needs recipientId and text. Sender id from request.user.id.
Store messages at context.messages[recipientId] (inbox) and context.sent[senderId] (sent box).
Use batch.destructureMustExist to pull both arrays after initialising them.`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

let messageCounter_value = 0;
function nextMessageId() { return ++messageCounter_value; }

const messages_namespace = "messages";
const sent_namespace     = "sent";

function inboxPath_namespace(userId_value) {
  return namespace.path.join(messages_namespace, userId_value);
}

function sentPath_namespace(userId_value) {
  return namespace.path.join(sent_namespace, userId_value);
}

module.exports = function handleSendMessage(context, request) {
  const responseBody_node = { success: false, statusCode: 400 };

  try {
    const recipientId_value = namespace.getMustExist(request, "body.recipientId", { errorMessage: "recipientId" });
    const text_value        = namespace.getMustExist(request, "body.text",        { errorMessage: "text" });
    const senderId_value    = namespace.getMustExist(request, "user.id",          { errorMessage: "user.id" });

    responseBody_node.statusCode = 500;

    namespace.setOrDefault(context, inboxPath_namespace(recipientId_value), []);
    namespace.setOrDefault(context, sentPath_namespace(senderId_value),     []);

    const { recipientInbox_node, senderSent_node } = namespace.batch.destructureMustExist(context, {
      recipientInbox_node: inboxPath_namespace(recipientId_value),
      senderSent_node:     sentPath_namespace(senderId_value),
    });

    const message_node = {
      id:          nextMessageId(),
      senderId:    senderId_value,
      recipientId: recipientId_value,
      text:        text_value,
      sentAt:      Date.now(),
    };
    recipientInbox_node.push(message_node);
    senderSent_node.push(message_node);
    namespace.set(responseBody_node, "results.message", message_node);

    responseBody_node.statusCode = 200;
    responseBody_node.success    = true;

  } catch (error) {
    responseBody_node.errorMessage = error.message;
  }

  return responseBody_node;
};`
  },

  {
    user: `Write a handler for booking an appointment.
Request body needs doctorId, date (ISO string), and notes (optional, default "").
User id from request.user.id.
Appointments live at context.appointments[userId] as an array.
Throw if the same user already has an appointment with the same doctor on the same date.`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

let appointmentCounter_value = 0;
function nextAppointmentId() { return ++appointmentCounter_value; }

const appointments_namespace = "appointments";

function userAppointmentsPath_namespace(userId_value) {
  return namespace.path.join(appointments_namespace, userId_value);
}

module.exports = function handleBookAppointment(context, request) {
  const responseBody_node = { success: false, statusCode: 400 };

  try {
    const doctorId_value = namespace.getMustExist(request, "body.doctorId", { errorMessage: "doctorId" });
    const date_value     = namespace.getMustExist(request, "body.date",     { errorMessage: "date" });
    const userId_value   = namespace.getMustExist(request, "user.id",       { errorMessage: "user.id" });

    const notes_value = namespace.getOrDefault(request, "body.notes", "");

    responseBody_node.statusCode = 500;

    namespace.setOrDefault(context, userAppointmentsPath_namespace(userId_value), []);
    const userAppointments_node = namespace.getMustExist(context, userAppointmentsPath_namespace(userId_value));

    const alreadyBooked_value = userAppointments_node.some(
      a => a.doctorId === doctorId_value && a.date === date_value
    );
    if (alreadyBooked_value) throw new Error("appointment already exists for this doctor and date");

    const appointment_node = {
      id:        nextAppointmentId(),
      doctorId:  doctorId_value,
      date:      date_value,
      notes:     notes_value,
      userId:    userId_value,
      createdAt: Date.now(),
    };
    userAppointments_node.push(appointment_node);
    namespace.set(responseBody_node, "results.appointment", appointment_node);

    responseBody_node.statusCode = 200;
    responseBody_node.success    = true;

  } catch (error) {
    responseBody_node.errorMessage = error.message;
  }

  return responseBody_node;
};`
  },

  {
    user: `Write a handler that subscribes a user to a plan.
Request body needs planId. User id from request.user.id.
A user can only have one active subscription — stored at context.subscriptions[userId].
Use getMustEmpty to enforce uniqueness before writing.`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const subscriptions_namespace = "subscriptions";

function userSubscriptionPath_namespace(userId_value) {
  return namespace.path.join(subscriptions_namespace, userId_value);
}

module.exports = function handleSubscribe(context, request) {
  const responseBody_node = { success: false, statusCode: 400 };

  try {
    const planId_value = namespace.getMustExist(request, "body.planId", { errorMessage: "planId" });
    const userId_value = namespace.getMustExist(request, "user.id",     { errorMessage: "user.id" });

    responseBody_node.statusCode = 500;

    namespace.getMustEmpty(context, userSubscriptionPath_namespace(userId_value));

    const subscription_node = {
      planId:       planId_value,
      userId:       userId_value,
      status:       "active",
      subscribedAt: Date.now(),
    };
    namespace.set(context, userSubscriptionPath_namespace(userId_value), subscription_node);
    namespace.set(responseBody_node, "results.subscription", subscription_node);

    responseBody_node.statusCode = 200;
    responseBody_node.success    = true;

  } catch (error) {
    responseBody_node.errorMessage = error.message;
  }

  return responseBody_node;
};`
  },

  {
    user: `Write a handler that updates an existing user's display name.
Request body needs newDisplayName. User id from request.user.id.
The user must already exist at context.users[userId] — use setMustExist to enforce this.`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

module.exports = function handleUpdateDisplayName(context, request) {
  const responseBody_node = { success: false, statusCode: 400 };

  try {
    const newDisplayName_value = namespace.getMustExist(request, "body.newDisplayName", { errorMessage: "newDisplayName" });
    const userId_value         = namespace.getMustExist(request, "user.id",             { errorMessage: "user.id" });

    responseBody_node.statusCode = 500;

    const displayNamePath_namespace = namespace.path.join("users", userId_value, "displayName");
    namespace.setMustExist(context, displayNamePath_namespace, newDisplayName_value);

    namespace.set(responseBody_node, "results.displayName", newDisplayName_value);
    responseBody_node.statusCode = 200;
    responseBody_node.success    = true;

  } catch (error) {
    responseBody_node.errorMessage = error.message;
  }

  return responseBody_node;
};`
  },

  {
    user: `Write a handler that consumes a one-time password-reset token.
Request body needs token and newPassword.
The token lives at context.resetTokens[token] and must be removed after use (one-time).
Use batch.extractMustExist to assert existence and remove in one step.`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

module.exports = function handlePasswordReset(context, request) {
  const responseBody_node = { success: false, statusCode: 400 };

  try {
    const token_value       = namespace.getMustExist(request, "body.token",       { errorMessage: "token" });
    const newPassword_value = namespace.getMustExist(request, "body.newPassword", { errorMessage: "newPassword" });

    responseBody_node.statusCode = 500;

    const tokenPath_namespace = namespace.path.join("resetTokens", token_value);
    const tokenData_node      = namespace.batch.extractMustExist(context, tokenPath_namespace);

    const passwordPath_namespace = namespace.path.join("users", tokenData_node.userId, "password");
    namespace.setOverwrite(context, passwordPath_namespace, newPassword_value);

    namespace.set(responseBody_node, "results.userId", tokenData_node.userId);
    responseBody_node.statusCode = 200;
    responseBody_node.success    = true;

  } catch (error) {
    responseBody_node.errorMessage = error.message;
  }

  return responseBody_node;
};`
  },

  {
    user: `Write a handler for recording an analytics event.
Request body needs eventName. properties is optional (default {}).
User id from request.user.id is optional — anonymous events are allowed (userId = null).
Events stored at context.analytics.events as an array.`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const analyticsEvents_namespace = "analytics.events";

module.exports = function handleAnalyticsEvent(context, request) {
  const responseBody_node = { success: false, statusCode: 400 };

  try {
    const eventName_value  = namespace.getMustExist(request, "body.eventName", { errorMessage: "eventName" });
    const properties_value = namespace.getOrDefault(request, "body.properties", {});

    const userId_probed = namespace.get(request, "user.id");
    const userId_value  = namespace.isNotFound(userId_probed) ? null : userId_probed;

    responseBody_node.statusCode = 500;

    namespace.setOrDefault(context, analyticsEvents_namespace, []);
    const events_node = namespace.getMustExist(context, analyticsEvents_namespace);

    const event_node = {
      eventName:  eventName_value,
      properties: properties_value,
      userId:     userId_value,
      recordedAt: Date.now(),
    };
    events_node.push(event_node);
    namespace.set(responseBody_node, "results.event", event_node);

    responseBody_node.statusCode = 200;
    responseBody_node.success    = true;

  } catch (error) {
    responseBody_node.errorMessage = error.message;
  }

  return responseBody_node;
};`
  },

  {
    user: `Write a handler for creating a blog post.
Request body needs title and content. tags is optional (default []).
User id from request.user.id.
Posts live at context.posts[userId] as an array.
Use batch.destructureMustExist with namespace.path.join to pull config and userPosts after convergence.`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

let postCounter_value = 0;
function nextPostId() { return ++postCounter_value; }

const posts_namespace  = "posts";
const config_namespace = "config";

function userPostsPath_namespace(userId_value) {
  return namespace.path.join(posts_namespace, userId_value);
}

module.exports = function handleCreatePost(context, request) {
  const responseBody_node = { success: false, statusCode: 400 };

  try {
    const title_value   = namespace.getMustExist(request, "body.title",   { errorMessage: "title" });
    const content_value = namespace.getMustExist(request, "body.content", { errorMessage: "content" });
    const userId_value  = namespace.getMustExist(request, "user.id",      { errorMessage: "user.id" });

    const tags_value = namespace.getOrDefault(request, "body.tags", []);

    responseBody_node.statusCode = 500;

    namespace.setOrDefault(context, config_namespace,                   { maxPostLength: 10000 });
    namespace.setOrDefault(context, userPostsPath_namespace(userId_value), []);

    const { config_node, userPosts_node } = namespace.batch.destructureMustExist(context, {
      config_node:    config_namespace,
      userPosts_node: userPostsPath_namespace(userId_value),
    });

    if (content_value.length > config_node.maxPostLength) {
      throw new Error("content exceeds maximum post length");
    }

    const post_node = {
      id:        nextPostId(),
      title:     title_value,
      content:   content_value,
      tags:      tags_value,
      userId:    userId_value,
      status:    "draft",
      createdAt: Date.now(),
    };
    userPosts_node.push(post_node);
    namespace.set(responseBody_node, "results.post", post_node);

    responseBody_node.statusCode = 200;
    responseBody_node.success    = true;

  } catch (error) {
    responseBody_node.errorMessage = error.message;
  }

  return responseBody_node;
};`
  },

  {
    user: `Write a handler for processing an order.
Request body needs orderId and items (array). User id from request.user.id.
Orders stored at context.orders[userId] as an array.
Use batch.destructureMustExist to pull config and userOrders after convergence.`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const orders_namespace = "orders";
const config_namespace = "config";

function userOrdersPath_namespace(userId_value) {
  return namespace.path.join(orders_namespace, userId_value);
}

module.exports = function handleProcessOrder(context, request) {
  const responseBody_node = { success: false, statusCode: 400 };

  try {
    const orderId_value = namespace.getMustExist(request, "body.orderId", { errorMessage: "orderId" });
    const items_value   = namespace.getMustExist(request, "body.items",   { errorMessage: "items" });
    const userId_value  = namespace.getMustExist(request, "user.id",      { errorMessage: "user.id" });

    responseBody_node.statusCode = 500;

    namespace.setOrDefault(context, config_namespace,                    { maxItemsPerOrder: 50 });
    namespace.setOrDefault(context, userOrdersPath_namespace(userId_value), []);

    const { config_node, userOrders_node } = namespace.batch.destructureMustExist(context, {
      config_node:    config_namespace,
      userOrders_node: userOrdersPath_namespace(userId_value),
    });

    if (items_value.length > config_node.maxItemsPerOrder) {
      throw new Error("order exceeds maximum item count");
    }

    const order_node = {
      orderId:     orderId_value,
      items:       items_value,
      userId:      userId_value,
      processedAt: Date.now(),
    };
    userOrders_node.push(order_node);
    namespace.set(responseBody_node, "results.order", order_node);

    responseBody_node.statusCode = 200;
    responseBody_node.success    = true;

  } catch (error) {
    responseBody_node.errorMessage = error.message;
  }

  return responseBody_node;
};`
  },

  // ── MODULE EXAMPLES ───────────────────────────────────────────────────────

  {
    user: `Write a cartModule with three functions:
- ensureCart(context, userId) — initialises cart items array at context.carts[userId].items if absent
- addItem(context, userId, item) — pushes an item onto the cart
- getCart(context, userId) — returns the items array`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const carts_namespace = "carts";

function cartItemsPath_namespace(userId_value) {
  return namespace.path.join(carts_namespace, userId_value, "items");
}

function ensureCart(context_node, userId_value) {
  return namespace.setOrDefault(context_node, cartItemsPath_namespace(userId_value), []);
}

function addItem(context_node, userId_value, item_node) {
  const cartItems_node = namespace.getMustExist(context_node, cartItemsPath_namespace(userId_value));
  cartItems_node.push(item_node);
  return cartItems_node;
}

function getCart(context_node, userId_value) {
  return namespace.getMustExist(context_node, cartItemsPath_namespace(userId_value));
}

module.exports = { ensureCart, addItem, getCart };`
  },

  {
    user: `Write a sessionModule with:
- ensureSession(context, sessionId) — initialises a session object at context.sessions[sessionId] if absent
- getSession(context, sessionId) — returns the session or throws
- setSessionData(context, sessionId, dataPath, value) — writes a value inside session.data using setOverwrite`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const sessions_namespace = "sessions";

function sessionPath_namespace(sessionId_value) {
  return namespace.path.join(sessions_namespace, sessionId_value);
}

function ensureSession(context_node, sessionId_value) {
  return namespace.setOrDefault(context_node, sessionPath_namespace(sessionId_value), {
    sessionId: sessionId_value,
    createdAt: Date.now(),
    data:      {},
  });
}

function getSession(context_node, sessionId_value) {
  return namespace.getMustExist(context_node, sessionPath_namespace(sessionId_value));
}

function setSessionData(context_node, sessionId_value, dataPath_namespace, dataValue) {
  const session_node      = getSession(context_node, sessionId_value);
  const fullPath_namespace = namespace.path.join("data", dataPath_namespace);
  namespace.setOverwrite(session_node, fullPath_namespace, dataValue);
}

module.exports = { ensureSession, getSession, setSessionData };`
  },

  {
    user: `Write a configModule with:
- ensureConfig(context, loaderFn) — calls loaderFn() to get config, stores at context.config if absent (convergence)
- getConfig(context) — returns the config or throws
- setConfigValue(context, path, value) — overwrites a value inside config`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const config_namespace = "config";

function ensureConfig(context_node, loaderFunction) {
  return namespace.setOrDefault(context_node, config_namespace, loaderFunction());
}

function getConfig(context_node) {
  return namespace.getMustExist(context_node, config_namespace);
}

function setConfigValue(context_node, path_namespace, value) {
  const config_node = getConfig(context_node);
  namespace.setOverwrite(config_node, path_namespace, value);
}

module.exports = { ensureConfig, getConfig, setConfigValue };`
  },

  {
    user: `Write a permissionsModule with:
- ensureUserPermissions(context, userId) — initialises an empty array at context.permissions[userId]
- grantPermission(context, userId, permission) — adds permission if not already present
- hasPermission(context, userId, permission) — returns true/false; handles absent user gracefully with isNotFound
- revokePermission(context, userId, permission) — removes permission if present`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const permissions_namespace = "permissions";

function userPermissionsPath_namespace(userId_value) {
  return namespace.path.join(permissions_namespace, userId_value);
}

function ensureUserPermissions(context_node, userId_value) {
  return namespace.setOrDefault(context_node, userPermissionsPath_namespace(userId_value), []);
}

function grantPermission(context_node, userId_value, permission_value) {
  ensureUserPermissions(context_node, userId_value);
  const userPermissions_node = namespace.getMustExist(context_node, userPermissionsPath_namespace(userId_value));
  if (!userPermissions_node.includes(permission_value)) {
    userPermissions_node.push(permission_value);
  }
}

function hasPermission(context_node, userId_value, permission_value) {
  const userPermissions_probed = namespace.get(context_node, userPermissionsPath_namespace(userId_value));
  if (namespace.isNotFound(userPermissions_probed)) return false;
  return userPermissions_probed.includes(permission_value);
}

function revokePermission(context_node, userId_value, permission_value) {
  const userPermissions_probed = namespace.get(context_node, userPermissionsPath_namespace(userId_value));
  if (namespace.isNotFound(userPermissions_probed)) return;
  const filtered_list = userPermissions_probed.filter(p => p !== permission_value);
  namespace.setOverwrite(context_node, userPermissionsPath_namespace(userId_value), filtered_list);
}

module.exports = { ensureUserPermissions, grantPermission, hasPermission, revokePermission };`
  },

  {
    user: `Write an inventoryModule with:
- ensureProduct(context, productId, initialStock) — initialises product at context.inventory[productId] if absent
- decrementStock(context, productId, quantity) — reduces stock, throws if insufficient
- getStock(context, productId) — returns the current stock count`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const inventory_namespace = "inventory";

function productPath_namespace(productId_value) {
  return namespace.path.join(inventory_namespace, productId_value);
}

function stockPath_namespace(productId_value) {
  return namespace.path.join(inventory_namespace, productId_value, "stock");
}

function ensureProduct(context_node, productId_value, initialStock_value) {
  return namespace.setOrDefault(context_node, productPath_namespace(productId_value), {
    productId: productId_value,
    stock:     initialStock_value,
  });
}

function decrementStock(context_node, productId_value, quantity_value) {
  const product_node = namespace.getMustExist(context_node, productPath_namespace(productId_value));
  if (product_node.stock < quantity_value) {
    throw new Error(\`insufficient stock for product "\${productId_value}"\`);
  }
  product_node.stock -= quantity_value;
  return product_node.stock;
}

function getStock(context_node, productId_value) {
  return namespace.getMustExist(context_node, stockPath_namespace(productId_value));
}

module.exports = { ensureProduct, decrementStock, getStock };`
  },

  {
    user: `Write a notificationModule with:
- ensureUserNotifications(context, userId) — initialises an empty array at context.notifications[userId]
- addNotification(context, userId, notification) — pushes a notification with read:false and createdAt
- getUnread(context, userId) — returns notifications where read is false
- markAllRead(context, userId) — sets read:true on all notifications`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const notifications_namespace = "notifications";

function userNotificationsPath_namespace(userId_value) {
  return namespace.path.join(notifications_namespace, userId_value);
}

function ensureUserNotifications(context_node, userId_value) {
  return namespace.setOrDefault(context_node, userNotificationsPath_namespace(userId_value), []);
}

function addNotification(context_node, userId_value, notification_node) {
  const notifications_node = namespace.getMustExist(context_node, userNotificationsPath_namespace(userId_value));
  notifications_node.push({ ...notification_node, read: false, createdAt: Date.now() });
}

function getUnread(context_node, userId_value) {
  const notifications_node = namespace.getMustExist(context_node, userNotificationsPath_namespace(userId_value));
  return notifications_node.filter(n => !n.read);
}

function markAllRead(context_node, userId_value) {
  const notifications_node = namespace.getMustExist(context_node, userNotificationsPath_namespace(userId_value));
  notifications_node.forEach(n => { n.read = true; });
}

module.exports = { ensureUserNotifications, addNotification, getUnread, markAllRead };`
  },

  {
    user: `Write a rateLimiterModule with:
- ensureRateLimit(context, ip) — initialises a counter record at context.rateLimits[ip] if absent
- incrementAndCheck(context, ip, maxRequests) — increments count, returns true if over limit
- resetRateLimit(context, ip) — resets the counter`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const rateLimits_namespace = "rateLimits";

function rateLimitPath_namespace(ip_value) {
  return namespace.path.join(rateLimits_namespace, ip_value);
}

function ensureRateLimit(context_node, ip_value) {
  return namespace.setOrDefault(context_node, rateLimitPath_namespace(ip_value), {
    count:       0,
    windowStart: Date.now(),
  });
}

function incrementAndCheck(context_node, ip_value, maxRequests_value) {
  const rateLimit_node  = namespace.getMustExist(context_node, rateLimitPath_namespace(ip_value));
  rateLimit_node.count += 1;
  return rateLimit_node.count > maxRequests_value;
}

function resetRateLimit(context_node, ip_value) {
  namespace.setOverwrite(context_node, rateLimitPath_namespace(ip_value), {
    count:       0,
    windowStart: Date.now(),
  });
}

module.exports = { ensureRateLimit, incrementAndCheck, resetRateLimit };`
  },

  {
    user: `Write a featureFlagsModule with:
- ensureFlags(context, defaultFlags) — stores defaultFlags at context.featureFlags if absent
- isEnabled(context, flagName) — returns true if the flag is true; handles absent flags with isNotFound
- setFlag(context, flagName, enabled) — overwrites the flag value`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const featureFlags_namespace = "featureFlags";

function flagPath_namespace(flagName_value) {
  return namespace.path.join(featureFlags_namespace, flagName_value);
}

function ensureFlags(context_node, defaultFlags_node) {
  return namespace.setOrDefault(context_node, featureFlags_namespace, defaultFlags_node);
}

function isEnabled(context_node, flagName_value) {
  const flagValue_probed = namespace.get(context_node, flagPath_namespace(flagName_value));
  if (namespace.isNotFound(flagValue_probed)) return false;
  return flagValue_probed === true;
}

function setFlag(context_node, flagName_value, enabled_value) {
  namespace.setOverwrite(context_node, flagPath_namespace(flagName_value), enabled_value);
}

module.exports = { ensureFlags, isEnabled, setFlag };`
  },

  {
    user: `Write a taskQueueModule with:
- ensureQueue(context, queueName) — initialises an empty array at context.queues[queueName]
- enqueue(context, queueName, task) — pushes a task onto the queue
- dequeue(context, queueName) — removes and returns the first task, or null if empty; use isNotFound
- peek(context, queueName) — returns first task without removing, or null`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const queues_namespace = "queues";

function queuePath_namespace(queueName_value) {
  return namespace.path.join(queues_namespace, queueName_value);
}

function ensureQueue(context_node, queueName_value) {
  return namespace.setOrDefault(context_node, queuePath_namespace(queueName_value), []);
}

function enqueue(context_node, queueName_value, task_node) {
  ensureQueue(context_node, queueName_value);
  const queue_node = namespace.getMustExist(context_node, queuePath_namespace(queueName_value));
  queue_node.push(task_node);
}

function dequeue(context_node, queueName_value) {
  const queue_probed = namespace.get(context_node, queuePath_namespace(queueName_value));
  if (namespace.isNotFound(queue_probed) || queue_probed.length === 0) return null;
  return queue_probed.shift();
}

function peek(context_node, queueName_value) {
  const queue_probed = namespace.get(context_node, queuePath_namespace(queueName_value));
  if (namespace.isNotFound(queue_probed) || queue_probed.length === 0) return null;
  return queue_probed[0];
}

module.exports = { ensureQueue, enqueue, dequeue, peek };`
  },

  {
    user: `Write a cacheModule with:
- setCache(context, key, value, ttlMs) — stores value with an expiresAt timestamp
- getCache(context, key) — returns value or null if absent or expired; use isNotFound
- invalidateCache(context, key) — removes the entry`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const cache_namespace = "cache";

function cacheEntryPath_namespace(key_value) {
  return namespace.path.join(cache_namespace, key_value);
}

function setCache(context_node, key_value, value, ttlMs_value) {
  const entry_node = {
    value,
    expiresAt: Date.now() + ttlMs_value,
  };
  namespace.setOverwrite(context_node, cacheEntryPath_namespace(key_value), entry_node);
}

function getCache(context_node, key_value) {
  const entry_probed = namespace.get(context_node, cacheEntryPath_namespace(key_value));
  if (namespace.isNotFound(entry_probed)) return null;
  if (Date.now() > entry_probed.expiresAt) return null;
  return entry_probed.value;
}

function invalidateCache(context_node, key_value) {
  const entry_probed = namespace.get(context_node, cacheEntryPath_namespace(key_value));
  if (!namespace.isNotFound(entry_probed)) {
    namespace.setOverwrite(context_node, cacheEntryPath_namespace(key_value), null);
  }
}

module.exports = { setCache, getCache, invalidateCache };`
  },

  // ── REFACTORING EXAMPLES ─────────────────────────────────────────────────

  {
    user: `Refactor this plain JS to use the namespace library:
\`\`\`js
function saveProfile(context, userId, data) {
  if (!context.profiles) context.profiles = {};
  if (!context.profiles[userId]) context.profiles[userId] = {};
  context.profiles[userId].name  = data.name;
  context.profiles[userId].email = data.email;
  return context.profiles[userId];
}
\`\`\``,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

function saveProfile(context_node, userId_value, data_node) {
  const profilePath_namespace = namespace.path.join("profiles", userId_value);
  namespace.setOrDefault(context_node, profilePath_namespace, {});
  const profile_node = namespace.getMustExist(context_node, profilePath_namespace);
  namespace.setOverwrite(profile_node, "name",  data_node.name);
  namespace.setOverwrite(profile_node, "email", data_node.email);
  return profile_node;
}

module.exports = { saveProfile };`
  },

  {
    user: `Refactor this plain JS handler to use the namespace library:
\`\`\`js
function handlePayment(req) {
  if (!req.body || !req.body.amount)   return { error: "amount required",   status: 400 };
  if (!req.body.currency)              return { error: "currency required",  status: 400 };
  if (!req.user || !req.user.id)       return { error: "user.id required",   status: 400 };
  try {
    // process...
    return { success: true, status: 200 };
  } catch (e) {
    return { error: e.message, status: 500 };
  }
}
\`\`\``,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

function handlePayment(context, request) {
  const responseBody_node = { success: false, statusCode: 400 };

  try {
    const amount_value   = namespace.getMustExist(request, "body.amount",   { errorMessage: "amount" });
    const currency_value = namespace.getMustExist(request, "body.currency", { errorMessage: "currency" });
    const userId_value   = namespace.getMustExist(request, "user.id",       { errorMessage: "user.id" });

    responseBody_node.statusCode = 500;

    // process payment...

    responseBody_node.statusCode = 200;
    responseBody_node.success    = true;

  } catch (error) {
    responseBody_node.errorMessage = error.message;
  }

  return responseBody_node;
}

module.exports = { handlePayment };`
  },

  {
    user: `Refactor this to use namespace:
\`\`\`js
function getNestedSetting(config, key) {
  const parts = key.split(".");
  let current = config;
  for (const part of parts) {
    if (current == null || !current.hasOwnProperty(part)) return null;
    current = current[part];
  }
  return current;
}
\`\`\``,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

function getNestedSetting(config_node, key_namespace) {
  const value_probed = namespace.get(config_node, key_namespace);
  return namespace.isNotFound(value_probed) ? null : value_probed;
}

module.exports = { getNestedSetting };`
  },

  {
    user: `Refactor this to use namespace:
\`\`\`js
function ensureUserData(store, userId) {
  if (!store.users) store.users = {};
  if (!store.users[userId]) {
    store.users[userId] = { entries: [], settings: { theme: "light" } };
  }
  return store.users[userId];
}
\`\`\``,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

function ensureUserData(store_node, userId_value) {
  const userPath_namespace = namespace.path.join("users", userId_value);
  return namespace.setOrDefault(store_node, userPath_namespace, {
    entries:  [],
    settings: { theme: "light" },
  });
}

module.exports = { ensureUserData };`
  },

  {
    user: `Refactor this to use namespace:
\`\`\`js
function processItem(context, itemId, data) {
  if (!context.items) context.items = {};
  if (context.items[itemId]) throw new Error("item already exists: " + itemId);
  context.items[itemId] = { ...data, createdAt: Date.now() };
  return context.items[itemId];
}
\`\`\``,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

function processItem(context_node, itemId_value, data_node) {
  const itemPath_namespace = namespace.path.join("items", itemId_value);
  namespace.getMustEmpty(context_node, itemPath_namespace); // throws if item already exists
  const item_node = { ...data_node, createdAt: Date.now() };
  namespace.set(context_node, itemPath_namespace, item_node);
  return item_node;
}

module.exports = { processItem };`
  },

  // ── PATH ALGEBRA EXAMPLES ─────────────────────────────────────────────────

  {
    user: `Write a function that builds a storage path for a user's file given a userId, folderId, and fileName using namespace.path.join.
Also write a function that checks if a given path is inside a specific user's storage subtree using namespace.path.isRootOf.`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const storage_namespace = "storage";

function filePath_namespace(userId_value, folderId_value, fileName_value) {
  return namespace.path.join(storage_namespace, userId_value, folderId_value, fileName_value);
}

function userStorageRoot_namespace(userId_value) {
  return namespace.path.join(storage_namespace, userId_value);
}

function isUserStoragePath(userId_value, path_namespace) {
  return namespace.path.isRootOf(userStorageRoot_namespace(userId_value), path_namespace);
}

module.exports = { filePath_namespace, userStorageRoot_namespace, isUserStoragePath };`
  },

  {
    user: `Write a function that takes a flat dotted path like "components.sidebar.nav" and converts it to a tree-shape path by inserting "children" between each segment, using namespace.path.tween.
Also write a version that uses a custom separator.`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

function toChildrenTreePath(dottedPath_namespace) {
  return namespace.path.tween(dottedPath_namespace, "children");
}

function toCustomTreePath(dottedPath_namespace, separator_value) {
  return namespace.path.tween(dottedPath_namespace, separator_value);
}

module.exports = { toChildrenTreePath, toCustomTreePath };`
  },

  {
    user: `Write a function that takes a dotted path string and returns an object containing:
- the full path as given
- the path split into segments
- the parent path (all segments except the last)
- the leaf key (last segment)`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

function analyzePath(dottedPath_namespace) {
  const segments_list        = namespace.path.split(dottedPath_namespace);
  const leafKey_value        = segments_list[segments_list.length - 1];
  const parentSegments_list  = segments_list.slice(0, -1);
  const parentPath_namespace = parentSegments_list.join(".");

  return {
    fullPath:   dottedPath_namespace,
    segments:   segments_list,
    parentPath: parentPath_namespace || null,
    leafKey:    leafKey_value,
  };
}

module.exports = { analyzePath };`
  },

  {
    user: `Write a function buildEventPath(tenantId, userId, eventType, date) that composes a storage path for events using namespace.path.join. All four parts are runtime values.`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const events_namespace = "events";

function buildEventPath_namespace(tenantId_value, userId_value, eventType_value, date_value) {
  return namespace.path.join(events_namespace, tenantId_value, userId_value, eventType_value, date_value);
}

module.exports = { buildEventPath_namespace };`
  },

  // ── BATCH EXAMPLES ───────────────────────────────────────────────────────

  {
    user: `Write a function that validates a config object has all required keys: "database.host", "database.port", "server.port", "auth.secret".
Throw a descriptive error if any is missing. Use namespace.batch.allMustExist.`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const requiredConfigPaths_list = [
  "database.host",
  "database.port",
  "server.port",
  "auth.secret",
];

function validateConfig(config_node) {
  return namespace.batch.allMustExist(config_node, requiredConfigPaths_list);
}

module.exports = { validateConfig };`
  },

  {
    user: `Write a function that reads config and userProfile from a context object in a single batch call using namespace.batch.destructureMustExist.
Both must be present or the function throws.`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

function readContextDependencies(context_node, userId_value) {
  const userProfilePath_namespace = namespace.path.join("users", userId_value, "profile");

  const { config_node, userProfile_node } = namespace.batch.destructureMustExist(context_node, {
    config_node:      "config",
    userProfile_node: userProfilePath_namespace,
  });

  return { config_node, userProfile_node };
}

module.exports = { readContextDependencies };`
  },

  {
    user: `Write a function that processes a webhook by consuming a one-time idempotency key.
The key lives at context.idempotencyKeys[key]. extractMustExist should be used to assert and remove it in one step.`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const idempotencyKeys_namespace = "idempotencyKeys";

function consumeIdempotencyKey(context_node, key_value) {
  const keyPath_namespace = namespace.path.join(idempotencyKeys_namespace, key_value);
  return namespace.batch.extractMustExist(context_node, keyPath_namespace);
}

function registerIdempotencyKey(context_node, key_value, metadata_node) {
  const keyPath_namespace = namespace.path.join(idempotencyKeys_namespace, key_value);
  namespace.getMustEmpty(context_node, keyPath_namespace);
  namespace.set(context_node, keyPath_namespace, { ...metadata_node, registeredAt: Date.now() });
}

module.exports = { consumeIdempotencyKey, registerIdempotencyKey };`
  },

  // ── UTILITY / MIXED EXAMPLES ──────────────────────────────────────────────

  {
    user: `Write a function searchProducts(context, filter) that searches context.products for matching products.
The filter may optionally contain category, maxPrice, and inStock fields.
Use namespace.exists to check which filters are active. Use namespace.get with isNotFound for the products list.`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

function searchProducts(context_node, filter_node) {
  const products_probed = namespace.get(context_node, "products");
  if (namespace.isNotFound(products_probed)) return [];

  return products_probed.filter(product_node => {
    if (namespace.exists(filter_node, "category")) {
      const category_value = namespace.getMustExist(filter_node, "category");
      if (product_node.category !== category_value) return false;
    }

    if (namespace.exists(filter_node, "maxPrice")) {
      const maxPrice_value = namespace.getMustExist(filter_node, "maxPrice");
      if (product_node.price > maxPrice_value) return false;
    }

    if (namespace.exists(filter_node, "inStock")) {
      const inStock_value = namespace.getMustExist(filter_node, "inStock");
      if (product_node.inStock !== inStock_value) return false;
    }

    return true;
  });
}

module.exports = { searchProducts };`
  },

  {
    user: `Write a processWebhookPayload(payload) function.
The payload must have event and data. timestamp is optional — if absent, use Date.now().
Use namespace.get + isNotFound for the optional field.`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

function processWebhookPayload(payload_node) {
  const event_value = namespace.getMustExist(payload_node, "event", { errorMessage: "event" });
  const data_value  = namespace.getMustExist(payload_node, "data",  { errorMessage: "data" });

  const timestamp_probed = namespace.get(payload_node, "timestamp");
  const timestamp_value  = namespace.isNotFound(timestamp_probed) ? Date.now() : timestamp_probed;

  return {
    event:       event_value,
    data:        data_value,
    timestamp:   timestamp_value,
    processedAt: Date.now(),
  };
}

module.exports = { processWebhookPayload };`
  },

  {
    user: `Write a function mergeUserPreferences(context, userId, newPreferences) that:
1. Ensures a preferences object exists at context.preferences[userId] via convergence
2. Overwrites each key in newPreferences into the existing preferences node`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const preferences_namespace = "preferences";

function userPreferencesPath_namespace(userId_value) {
  return namespace.path.join(preferences_namespace, userId_value);
}

function mergeUserPreferences(context_node, userId_value, newPreferences_node) {
  namespace.setOrDefault(context_node, userPreferencesPath_namespace(userId_value), {});
  const preferences_node = namespace.getMustExist(context_node, userPreferencesPath_namespace(userId_value));

  for (const [key_value, value] of Object.entries(newPreferences_node)) {
    namespace.setOverwrite(preferences_node, key_value, value);
  }

  return preferences_node;
}

module.exports = { mergeUserPreferences };`
  },

  {
    user: `Write an auditLogModule with:
- ensureAuditLog(context) — initialises context.auditLog as an array if absent
- logAction(context, userId, action, details) — appends an audit entry
- getRecentActions(context, limit) — returns the last N entries`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const auditLog_namespace = "auditLog";

function ensureAuditLog(context_node) {
  return namespace.setOrDefault(context_node, auditLog_namespace, []);
}

function logAction(context_node, userId_value, action_value, details_node) {
  const auditLog_node = namespace.getMustExist(context_node, auditLog_namespace);
  auditLog_node.push({
    userId:    userId_value,
    action:    action_value,
    details:   details_node,
    timestamp: Date.now(),
  });
}

function getRecentActions(context_node, limit_value) {
  const auditLog_node = namespace.getMustExist(context_node, auditLog_namespace);
  return auditLog_node.slice(-limit_value);
}

module.exports = { ensureAuditLog, logAction, getRecentActions };`
  },

  {
    user: `Write a leaderboardModule with:
- ensureLeaderboard(context, leaderboardId) — initialises an empty entries array at context.leaderboards[leaderboardId].entries
- submitScore(context, leaderboardId, userId, score) — adds or updates the user's score entry; overwrite if already exists
- getTopN(context, leaderboardId, n) — returns the top N entries sorted by score descending`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const leaderboards_namespace = "leaderboards";

function leaderboardEntriesPath_namespace(leaderboardId_value) {
  return namespace.path.join(leaderboards_namespace, leaderboardId_value, "entries");
}

function ensureLeaderboard(context_node, leaderboardId_value) {
  return namespace.setOrDefault(context_node, leaderboardEntriesPath_namespace(leaderboardId_value), []);
}

function submitScore(context_node, leaderboardId_value, userId_value, score_value) {
  const entries_node        = namespace.getMustExist(context_node, leaderboardEntriesPath_namespace(leaderboardId_value));
  const existingIndex_value = entries_node.findIndex(e => e.userId === userId_value);

  if (existingIndex_value >= 0) {
    entries_node[existingIndex_value].score     = score_value;
    entries_node[existingIndex_value].updatedAt = Date.now();
  } else {
    entries_node.push({ userId: userId_value, score: score_value, submittedAt: Date.now() });
  }
}

function getTopN(context_node, leaderboardId_value, n_value) {
  const entries_node = namespace.getMustExist(context_node, leaderboardEntriesPath_namespace(leaderboardId_value));
  return [...entries_node].sort((a, b) => b.score - a.score).slice(0, n_value);
}

module.exports = { ensureLeaderboard, submitScore, getTopN };`
  },

  {
    user: `Write a votingModule with:
- createPoll(context, pollId, options) — creates a poll at context.polls[pollId] with vote counts; throw if poll already exists
- castVote(context, pollId, userId, option) — records a vote; throw if user already voted or option doesn't exist
- getResults(context, pollId) — returns the poll with vote counts`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const polls_namespace = "polls";

function pollPath_namespace(pollId_value) {
  return namespace.path.join(polls_namespace, pollId_value);
}

function createPoll(context_node, pollId_value, options_list) {
  const pollPath = pollPath_namespace(pollId_value);
  namespace.getMustEmpty(context_node, pollPath);

  const counts_node = {};
  for (const option_value of options_list) {
    counts_node[option_value] = 0;
  }

  namespace.set(context_node, pollPath, {
    pollId:    pollId_value,
    options:   options_list,
    counts:    counts_node,
    voters:    [],
    createdAt: Date.now(),
  });
}

function castVote(context_node, pollId_value, userId_value, option_value) {
  const poll_node = namespace.getMustExist(context_node, pollPath_namespace(pollId_value));

  if (poll_node.voters.includes(userId_value)) throw new Error("user has already voted");
  if (!poll_node.options.includes(option_value)) throw new Error(\`invalid option: "\${option_value}"\`);

  poll_node.counts[option_value] += 1;
  poll_node.voters.push(userId_value);
}

function getResults(context_node, pollId_value) {
  return namespace.getMustExist(context_node, pollPath_namespace(pollId_value));
}

module.exports = { createPoll, castVote, getResults };`
  },

  {
    user: `Write a multiTenantModule with:
- ensureTenant(context, tenantId, config) — initialises a tenant subtree at context.tenants[tenantId] with a config and empty users map
- getTenantConfig(context, tenantId) — returns the tenant's config
- ensureTenantUser(context, tenantId, userId) — initialises per-user data within the tenant subtree using path.join`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const tenants_namespace = "tenants";

function tenantPath_namespace(tenantId_value) {
  return namespace.path.join(tenants_namespace, tenantId_value);
}

function tenantConfigPath_namespace(tenantId_value) {
  return namespace.path.join(tenants_namespace, tenantId_value, "config");
}

function tenantUserPath_namespace(tenantId_value, userId_value) {
  return namespace.path.join(tenants_namespace, tenantId_value, "users", userId_value);
}

function ensureTenant(context_node, tenantId_value, config_node) {
  return namespace.setOrDefault(context_node, tenantPath_namespace(tenantId_value), {
    tenantId:  tenantId_value,
    config:    config_node,
    users:     {},
    createdAt: Date.now(),
  });
}

function getTenantConfig(context_node, tenantId_value) {
  return namespace.getMustExist(context_node, tenantConfigPath_namespace(tenantId_value));
}

function ensureTenantUser(context_node, tenantId_value, userId_value) {
  return namespace.setOrDefault(context_node, tenantUserPath_namespace(tenantId_value, userId_value), {
    userId:    userId_value,
    tenantId:  tenantId_value,
    createdAt: Date.now(),
  });
}

module.exports = { ensureTenant, getTenantConfig, ensureTenantUser };`
  },

  {
    user: `Write a workflowModule with:
- createWorkflow(context, workflowId, steps) — creates a workflow at context.workflows[workflowId] with a steps array and currentStep index of 0; throw if already exists
- advanceStep(context, workflowId) — increments currentStep; throw if already at last step
- getCurrentStep(context, workflowId) — returns the current step object`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const workflows_namespace = "workflows";

function workflowPath_namespace(workflowId_value) {
  return namespace.path.join(workflows_namespace, workflowId_value);
}

function createWorkflow(context_node, workflowId_value, steps_list) {
  namespace.getMustEmpty(context_node, workflowPath_namespace(workflowId_value));
  namespace.set(context_node, workflowPath_namespace(workflowId_value), {
    workflowId:  workflowId_value,
    steps:       steps_list,
    currentStep: 0,
    createdAt:   Date.now(),
  });
}

function advanceStep(context_node, workflowId_value) {
  const workflow_node = namespace.getMustExist(context_node, workflowPath_namespace(workflowId_value));
  if (workflow_node.currentStep >= workflow_node.steps.length - 1) {
    throw new Error("workflow is already at the last step");
  }
  workflow_node.currentStep += 1;
  return workflow_node.steps[workflow_node.currentStep];
}

function getCurrentStep(context_node, workflowId_value) {
  const workflow_node         = namespace.getMustExist(context_node, workflowPath_namespace(workflowId_value));
  const currentStepIndex_value = workflow_node.currentStep;
  return workflow_node.steps[currentStepIndex_value];
}

module.exports = { createWorkflow, advanceStep, getCurrentStep };`
  },

  {
    user: `Write an abTestModule with:
- ensureExperiment(context, experimentId, variants) — initialises an experiment at context.experiments[experimentId] with variant assignment counts
- assignVariant(context, experimentId, userId) — assigns a user to the variant with fewest assignments; stores assignment at context.assignments[userId][experimentId]
- getAssignment(context, userId, experimentId) — returns the assigned variant or null using isNotFound`,
    assistant:
`"use strict";
const namespace = require('@visualtools001/namespace');

const experiments_namespace = "experiments";
const assignments_namespace  = "assignments";

function experimentPath_namespace(experimentId_value) {
  return namespace.path.join(experiments_namespace, experimentId_value);
}

function userAssignmentPath_namespace(userId_value, experimentId_value) {
  return namespace.path.join(assignments_namespace, userId_value, experimentId_value);
}

function ensureExperiment(context_node, experimentId_value, variants_list) {
  const counts_node = {};
  for (const variant_value of variants_list) {
    counts_node[variant_value] = 0;
  }
  return namespace.setOrDefault(context_node, experimentPath_namespace(experimentId_value), {
    experimentId: experimentId_value,
    variants:     variants_list,
    counts:       counts_node,
  });
}

function assignVariant(context_node, experimentId_value, userId_value) {
  const experiment_node = namespace.getMustExist(context_node, experimentPath_namespace(experimentId_value));
  const assignmentPath_namespace = userAssignmentPath_namespace(userId_value, experimentId_value);

  const existing_probed = namespace.get(context_node, assignmentPath_namespace);
  if (!namespace.isNotFound(existing_probed)) return existing_probed;

  const leastAssigned_value = experiment_node.variants.reduce((minVariant_value, variant_value) =>
    experiment_node.counts[variant_value] < experiment_node.counts[minVariant_value]
      ? variant_value
      : minVariant_value
  );

  experiment_node.counts[leastAssigned_value] += 1;
  namespace.set(context_node, assignmentPath_namespace, leastAssigned_value);
  return leastAssigned_value;
}

function getAssignment(context_node, userId_value, experimentId_value) {
  const assignment_probed = namespace.get(context_node, userAssignmentPath_namespace(userId_value, experimentId_value));
  return namespace.isNotFound(assignment_probed) ? null : assignment_probed;
}

module.exports = { ensureExperiment, assignVariant, getAssignment };`
  },

];

// Output as JSONL
for (const example of examples) {
  const line = JSON.stringify({
    messages: [
      { role: "system",    content: SYSTEM },
      { role: "user",      content: example.user },
      { role: "assistant", content: example.assistant },
    ]
  });
  process.stdout.write(line + "\n");
}

process.stderr.write(`Generated ${examples.length} examples.\n`);
