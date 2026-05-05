"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationParticipantModel = void 0;
const dynamodb_1 = __importDefault(require("../configs/dynamodb"));
const TABLE_NAME = "conversation_participants";
class ConversationParticipantModel {
    static async create(participantData) {
        const now = new Date().toISOString();
        const params = {
            TableName: TABLE_NAME,
            Item: {
                ...participantData,
                joined_at: now,
                created_at: now,
                is_active: true,
                unread_count: 0,
            },
        };
        await dynamodb_1.default.put(params).promise();
        return params.Item;
    }
    static async findConversationsForUser(userId, limit = 20, lastEvaluatedKey = null) {
        const params = {
            TableName: TABLE_NAME,
            IndexName: "user_id-conversation_id-index",
            KeyConditionExpression: "user_id = :userId",
            ExpressionAttributeValues: {
                ":userId": userId,
                ":is_active": true,
            },
            FilterExpression: "is_active = :is_active",
            Limit: limit,
            ScanIndexForward: false,
        };
        if (lastEvaluatedKey) {
            params.ExclusiveStartKey = lastEvaluatedKey;
        }
        const result = await dynamodb_1.default.query(params).promise();
        return {
            items: result.Items,
            lastEvaluatedKey: result.LastEvaluatedKey,
        };
    }
    static async findMembersOfConversation(conversationId) {
        const params = {
            TableName: TABLE_NAME,
            KeyConditionExpression: "conversation_id = :conversationId",
            ExpressionAttributeValues: {
                ":conversationId": conversationId,
                ":is_active": true,
            },
            FilterExpression: "is_active = :is_active",
        };
        const result = await dynamodb_1.default.query(params).promise();
        return result.Items;
    }
    static async isMember(conversationId, userId) {
        const params = {
            TableName: TABLE_NAME,
            Key: {
                conversation_id: conversationId,
                user_id: userId,
            },
        };
        const result = await dynamodb_1.default.get(params).promise();
        return !!result.Item;
    }
    static async updateUnreadCount(conversationId, userId, increment = 1) {
        const params = {
            TableName: TABLE_NAME,
            Key: {
                conversation_id: conversationId,
                user_id: userId,
            },
            UpdateExpression: "SET unread_count = unread_count + :increment",
            ExpressionAttributeValues: {
                ":increment": increment,
            },
            ReturnValues: "ALL_NEW",
        };
        const result = await dynamodb_1.default.update(params).promise();
        return result.Attributes;
    }
    static async markAsRead(conversationId, userId) {
        const now = new Date().toISOString();
        const params = {
            TableName: TABLE_NAME,
            Key: {
                conversation_id: conversationId,
                user_id: userId,
            },
            UpdateExpression: "SET unread_count = :zero, last_read_at = :lastReadAt",
            ExpressionAttributeValues: {
                ":zero": 0,
                ":lastReadAt": now,
            },
            ReturnValues: "ALL_NEW",
        };
        const result = await dynamodb_1.default.update(params).promise();
        return result.Attributes;
    }
    static async updateSettings(conversationId, userId, settings) {
        const updateExpressions = [];
        const expressionAttributeValues = {};
        if (settings.is_muted !== undefined) {
            updateExpressions.push("is_muted = :isMuted");
            expressionAttributeValues[":isMuted"] = settings.is_muted;
        }
        if (settings.is_pinned !== undefined) {
            updateExpressions.push("is_pinned = :isPinned");
            expressionAttributeValues[":isPinned"] = settings.is_pinned;
        }
        const params = {
            TableName: TABLE_NAME,
            Key: {
                conversation_id: conversationId,
                user_id: userId,
            },
            UpdateExpression: "SET " + updateExpressions.join(", "),
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW",
        };
        const result = await dynamodb_1.default.update(params).promise();
        return result.Attributes;
    }
    static async remove(conversationId, userId) {
        const params = {
            TableName: TABLE_NAME,
            Key: {
                conversation_id: conversationId,
                user_id: userId,
            },
        };
        await dynamodb_1.default.delete(params).promise();
        return { success: true };
    }
    static async markAsInactive(conversationId, userId) {
        const params = {
            TableName: TABLE_NAME,
            Key: {
                conversation_id: conversationId,
                user_id: userId,
            },
            UpdateExpression: "SET is_active = :isActive",
            ExpressionAttributeValues: {
                ":isActive": false,
            },
            ReturnValues: "ALL_NEW",
        };
        const result = await dynamodb_1.default.update(params).promise();
        return result.Attributes;
    }
    static async markAsDeleted(conversationId, userId) {
        const now = new Date().toISOString();
        const params = {
            TableName: TABLE_NAME,
            Key: {
                conversation_id: conversationId,
                user_id: userId,
            },
            UpdateExpression: "SET deleted_at = :deletedAt, updated_at = :updatedAt",
            ExpressionAttributeValues: {
                ":deletedAt": now,
                ":updatedAt": now,
            },
            ReturnValues: "ALL_NEW",
        };
        const result = await dynamodb_1.default.update(params).promise();
        return result.Attributes;
    }
    static async restoreConversation(conversationId, userId) {
        const params = {
            TableName: TABLE_NAME,
            Key: {
                conversation_id: conversationId,
                user_id: userId,
            },
            UpdateExpression: "REMOVE deleted_at",
            ReturnValues: "ALL_NEW",
        };
        const result = await dynamodb_1.default.update(params).promise();
        return result.Attributes;
    }
    static async addParticipant(conversationId, userId, role = "member") {
        return this.create({
            conversation_id: conversationId,
            user_id: userId,
            role,
        });
    }
    static async findByUserId(userId, limit = 20, lastEvaluatedKey = null) {
        return this.findConversationsForUser(userId, limit, lastEvaluatedKey);
    }
    static async getDeletedAt(conversationId, userId) {
        const params = {
            TableName: TABLE_NAME,
            Key: {
                conversation_id: conversationId,
                user_id: userId,
            },
        };
        const result = await dynamodb_1.default.get(params).promise();
        return result.Item?.deleted_at || null;
    }
}
exports.ConversationParticipantModel = ConversationParticipantModel;
