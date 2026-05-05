import { v4 as uuidv4 } from "uuid";
import dynamodb from "../configs/dynamodb";

const TABLE_NAME = "messages";

export class MessageModel {
    static async create(messageData: any) {
        const message_id = uuidv4();
        const now = new Date().toISOString();

        const params = {
            TableName: TABLE_NAME,
            Item: {
                message_id,
                ...messageData,
                created_at: now,
                updated_at: now,
                is_read: false,
                is_deleted: false,
                is_edited: false,
                is_recalled: false,
                deleted_for_everyone: false,
                deleted_by: dynamodb.createSet(["dummy"]), // create empty set workaround or add dummy
            },
        };
        // Fix empty set
        delete params.Item.deleted_by;

        await dynamodb.put(params).promise();
        return params.Item;
    }

    static async findById(conversationId: string, messageId: string) {
        const params = {
            TableName: TABLE_NAME,
            Key: { conversation_id: conversationId, message_id: messageId },
        };

        const result = await dynamodb.get(params).promise();
        return result.Item || null;
    }

    static async getHistory(conversationId: string, limit = 50, cursor: any = null, userId: string | null = null, deletedAt: string | null = null) {
        const params: any = {
            TableName: TABLE_NAME,
            KeyConditionExpression: "conversation_id = :conversationId",
            ExpressionAttributeValues: {
                ":conversationId": conversationId,
            },
            Limit: limit,
            ScanIndexForward: false, // des descending (newest first)
        };
        
        if (cursor) {
            params.ExclusiveStartKey = cursor;
        }

        const result = await dynamodb.query(params).promise();

        // Filter out messages that have been deleted by this user
        let messages = result.Items || [];
        if (userId) {
            messages = messages.filter((msg) => {
                const deletedBy = msg.deleted_by?.values || [];
                return !deletedBy.includes(userId);
            });
        }

        // Filter out messages created before user deleted the conversation
        if (deletedAt) {
            messages = messages.filter((msg) => new Date(msg.created_at) > new Date(deletedAt));
        }

        return {
            messages,
            lastKey: result.LastEvaluatedKey,
        };
    }

    static async update(conversationId: string, messageId: string, updateData: any) {
        const now = new Date().toISOString();
        const updateFields = Object.keys(updateData)
            .map((key) => `${key} = :${key}`)
            .join(", ");

        const expressionAttributeValues = Object.keys(updateData).reduce(
            (acc: any, key) => {
                acc[`:${key}`] = updateData[key];
                return acc;
            },
            { ":updated_at": now }
        );

        const params = {
            TableName: TABLE_NAME,
            Key: { conversation_id: conversationId, message_id: messageId },
            UpdateExpression: `SET ${updateFields}, updated_at = :updated_at`,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW",
        };

        const result = await dynamodb.update(params).promise();
        return result.Attributes;
    }

    static async updateStatus(conversationId: string, messageId: string, isRead = true) {
        const now = new Date().toISOString();
        const params = {
            TableName: TABLE_NAME,
            Key: { conversation_id: conversationId, message_id: messageId },
            UpdateExpression: "SET is_read = :is_read, read_at = :read_at",
            ExpressionAttributeValues: {
                ":is_read": isRead,
                ":read_at": now,
            },
            ReturnValues: "ALL_NEW",
        };

        const result = await dynamodb.update(params).promise();
        return result.Attributes;
    }

    static async deleteForEveryone(conversationId: string, messageId: string) {
        const now = new Date().toISOString();
        const params = {
            TableName: TABLE_NAME,
            Key: { conversation_id: conversationId, message_id: messageId },
            UpdateExpression: "SET deleted_for_everyone = :deleted_for_everyone, updated_at = :updated_at",
            ExpressionAttributeValues: {
                ":deleted_for_everyone": true,
                ":updated_at": now,
            },
            ReturnValues: "ALL_NEW",
        };

        const result = await dynamodb.update(params).promise();
        return result.Attributes;
    }

    // Delete message for a specific user (Delete for Me)
    static async deleteMessageForUser(conversationId: string, messageId: string, userId: string) {
        const now = new Date().toISOString();

        // Try to add to existing set first
        try {
            const params = {
                TableName: TABLE_NAME,
                Key: { conversation_id: conversationId, message_id: messageId },
                UpdateExpression: "ADD deleted_by :userId SET updated_at = :updated_at",
                ExpressionAttributeValues: {
                    ":userId": dynamodb.createSet([userId]),
                    ":updated_at": now,
                },
                ReturnValues: "ALL_NEW",
            };

            const result = await dynamodb.update(params).promise();
            return result.Attributes;
        } catch (error: any) {
            // If ADD fails (attribute doesn't exist or is NULL), use SET to create it
            if (error.message.includes("ADD") || error.message.includes("NULL")) {
                const params = {
                    TableName: TABLE_NAME,
                    Key: { conversation_id: conversationId, message_id: messageId },
                    UpdateExpression: "SET deleted_by = :userId, updated_at = :updated_at",
                    ExpressionAttributeValues: {
                        ":userId": dynamodb.createSet([userId]),
                        ":updated_at": now,
                    },
                    ReturnValues: "ALL_NEW",
                };

                const result = await dynamodb.update(params).promise();
                return result.Attributes;
            }
            throw error;
        }
    }

    // Check if message is deleted for a specific user
    static async isDeletedForUser(conversationId: string, messageId: string, userId: string) {
        const message = await this.findById(conversationId, messageId);
        if (!message) return true;

        const deletedBy = message.deleted_by?.values || [];
        return deletedBy.includes(userId);
    }

    // Recall message (soft delete for all users)
    static async recall(conversationId: string, messageId: string) {
        const now = new Date().toISOString();
        const params = {
            TableName: TABLE_NAME,
            Key: { conversation_id: conversationId, message_id: messageId },
            UpdateExpression: "SET is_recalled = :is_recalled, recalled_at = :recalled_at, updated_at = :updated_at",
            ExpressionAttributeValues: {
                ":is_recalled": true,
                ":recalled_at": now,
                ":updated_at": now,
            },
            ReturnValues: "ALL_NEW",
        };

        const result = await dynamodb.update(params).promise();
        return result.Attributes;
    }

    static async addReaction(conversationId: string, messageId: string, emoji: string, userId: string) {
        const params = {
            TableName: TABLE_NAME,
            Key: { conversation_id: conversationId, message_id: messageId },
            UpdateExpression: "SET reactions = if_not_exists(reactions, :empty) + :reaction",
            ExpressionAttributeValues: {
                ":empty": [],
                ":reaction": [{ emoji, userId, createdAt: new Date().toISOString() }],
            },
            ReturnValues: "ALL_NEW",
        };

        const result = await dynamodb.update(params).promise();
        return result.Attributes;
    }

    static async removeReaction(conversationId: string, messageId: string, emoji: string, userId: string) {
        const message = await this.findById(conversationId, messageId);
        if (!message) return null;

        const reactions = (message.reactions || []).filter((r: any) => !(r.emoji === emoji && r.userId === userId));

        const params = {
            TableName: TABLE_NAME,
            Key: { conversation_id: conversationId, message_id: messageId },
            UpdateExpression: "SET reactions = :reactions",
            ExpressionAttributeValues: {
                ":reactions": reactions,
            },
            ReturnValues: "ALL_NEW",
        };

        const result = await dynamodb.update(params).promise();
        return result.Attributes;
    }

    static async countUnread(conversationId: string, userId: string) {
        const params = {
            TableName: TABLE_NAME,
            KeyConditionExpression:
                "conversation_id = :conversationId AND is_deleted = :is_deleted AND is_read = :is_read",
            ExpressionAttributeValues: {
                ":conversationId": conversationId,
                ":is_deleted": false,
                ":is_read": false,
            },
            Select: "COUNT",
        };

        const result = await dynamodb.query(params).promise();
        return result.Count;
    }
}
