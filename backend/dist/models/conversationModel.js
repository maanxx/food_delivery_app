"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationModel = void 0;
const uuid_1 = require("uuid");
const dynamodb_1 = __importDefault(require("../configs/dynamodb"));
const conversationParticipantModel_1 = require("./conversationParticipantModel");
const TABLE_NAME = "conversations";
class ConversationModel {
    static async create(conversationData) {
        const conversation_id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const params = {
            TableName: TABLE_NAME,
            Item: {
                conversation_id,
                ...conversationData,
                created_at: now,
                updated_at: now,
                is_active: true,
            },
        };
        await dynamodb_1.default.put(params).promise();
        return params.Item;
    }
    static async findById(conversationId) {
        const params = {
            TableName: TABLE_NAME,
            Key: { conversation_id: conversationId },
        };
        const result = await dynamodb_1.default.get(params).promise();
        return result.Item || null;
    }
    static async findByIdAndUserId(conversationId, userId) {
        const conversation = await this.findById(conversationId);
        if (!conversation)
            return null;
        // Check if user is participant
        const isParticipant = await conversationParticipantModel_1.ConversationParticipantModel.isMember(conversationId, userId);
        if (!isParticipant)
            return null;
        return conversation;
    }
    static async update(conversationId, updateData) {
        const now = new Date().toISOString();
        const updateFields = Object.keys(updateData)
            .map((key) => `${key} = :${key}`)
            .join(", ");
        const expressionAttributeValues = Object.keys(updateData).reduce((acc, key) => {
            acc[`:${key}`] = updateData[key];
            return acc;
        }, { ":updated_at": now });
        const params = {
            TableName: TABLE_NAME,
            Key: { conversation_id: conversationId },
            UpdateExpression: `SET ${updateFields}, updated_at = :updated_at`,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW",
        };
        const result = await dynamodb_1.default.update(params).promise();
        return result.Attributes;
    }
    static async updateLastMessage(conversationId, messageId, timestamp) {
        return this.update(conversationId, {
            last_message_id: messageId,
            last_message_timestamp: timestamp,
        });
    }
    static async findDirectConversation(userId1, userId2) {
        // This is a complex query in DynamoDB if not modeled with GSI
        // For now, we'll search by creator_id and assume 1to1
        const params = {
            TableName: TABLE_NAME,
            IndexName: "creator_id-index", // Assuming this index exists
            KeyConditionExpression: "creator_id = :userId",
            FilterExpression: "type = :type",
            ExpressionAttributeValues: {
                ":userId": userId1,
                ":type": "1to1",
            },
        };
        // Note: Real implementation would need a more robust way to find 1to1 between 2 users
        // For now, let's provide a stub that matches the service's expectations
        const result = await dynamodb_1.default.query(params).promise();
        return result.Items?.[0] || null;
    }
    static async delete(conversationId) {
        const params = {
            TableName: TABLE_NAME,
            Key: { conversation_id: conversationId },
            UpdateExpression: "SET is_active = :is_active, updated_at = :updated_at",
            ExpressionAttributeValues: {
                ":is_active": false,
                ":updated_at": new Date().toISOString(),
            },
        };
        await dynamodb_1.default.update(params).promise();
    }
}
exports.ConversationModel = ConversationModel;
