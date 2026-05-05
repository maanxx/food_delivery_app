import dynamodb from "../configs/dynamodb";

const TABLE_NAME = "conversation_participants";

export class ConversationParticipantModel {
    static async create(participantData: any) {
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

        await dynamodb.put(params).promise();
        return params.Item;
    }

    static async findConversationsForUser(userId: string, limit = 20, lastEvaluatedKey: any = null) {
        const params: any = {
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

        const result = await dynamodb.query(params).promise();
        return {
            items: result.Items,
            lastEvaluatedKey: result.LastEvaluatedKey,
        };
    }

    static async findMembersOfConversation(conversationId: string) {
        const params = {
            TableName: TABLE_NAME,
            KeyConditionExpression: "conversation_id = :conversationId",
            ExpressionAttributeValues: {
                ":conversationId": conversationId,
                ":is_active": true,
            },
            FilterExpression: "is_active = :is_active",
        };

        const result = await dynamodb.query(params).promise();
        return result.Items;
    }

    static async isMember(conversationId: string, userId: string) {
        const params = {
            TableName: TABLE_NAME,
            Key: {
                conversation_id: conversationId,
                user_id: userId,
            },
        };

        const result = await dynamodb.get(params).promise();
        return !!result.Item;
    }

    static async updateUnreadCount(conversationId: string, userId: string, increment = 1) {
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

        const result = await dynamodb.update(params).promise();
        return result.Attributes;
    }

    static async markAsRead(conversationId: string, userId: string) {
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

        const result = await dynamodb.update(params).promise();
        return result.Attributes;
    }

    static async updateSettings(conversationId: string, userId: string, settings: any) {
        const updateExpressions: string[] = [];
        const expressionAttributeValues: any = {};

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

        const result = await dynamodb.update(params).promise();
        return result.Attributes;
    }

    static async remove(conversationId: string, userId: string) {
        const params = {
            TableName: TABLE_NAME,
            Key: {
                conversation_id: conversationId,
                user_id: userId,
            },
        };

        await dynamodb.delete(params).promise();
        return { success: true };
    }

    static async markAsInactive(conversationId: string, userId: string) {
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

        const result = await dynamodb.update(params).promise();
        return result.Attributes;
    }

    static async markAsDeleted(conversationId: string, userId: string) {
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

        const result = await dynamodb.update(params).promise();
        return result.Attributes;
    }

    static async restoreConversation(conversationId: string, userId: string) {
        const params = {
            TableName: TABLE_NAME,
            Key: {
                conversation_id: conversationId,
                user_id: userId,
            },
            UpdateExpression: "REMOVE deleted_at",
            ReturnValues: "ALL_NEW",
        };

        const result = await dynamodb.update(params).promise();
        return result.Attributes;
    }

    static async addParticipant(conversationId: string, userId: string, role = "member") {
        return this.create({
            conversation_id: conversationId,
            user_id: userId,
            role,
        });
    }

    static async findByUserId(userId: string, limit = 20, lastEvaluatedKey: any = null) {
        return this.findConversationsForUser(userId, limit, lastEvaluatedKey);
    }

    static async getDeletedAt(conversationId: string, userId: string) {
        const params = {
            TableName: TABLE_NAME,
            Key: {
                conversation_id: conversationId,
                user_id: userId,
            },
        };

        const result = await dynamodb.get(params).promise();
        return result.Item?.deleted_at || null;
    }

    static async findByUserIdAndConvId(userId: string, conversationId: string) {
        const params = {
            TableName: TABLE_NAME,
            Key: {
                conversation_id: conversationId,
                user_id: userId,
            },
        };

        const result = await dynamodb.get(params).promise();
        return result.Item || null;
    }

    static async updateRole(conversationId: string, userId: string, role: string) {
        const params = {
            TableName: TABLE_NAME,
            Key: {
                conversation_id: conversationId,
                user_id: userId,
            },
            UpdateExpression: "SET #role = :role, updated_at = :updatedAt",
            ExpressionAttributeNames: {
                "#role": "role",
            },
            ExpressionAttributeValues: {
                ":role": role,
                ":updatedAt": new Date().toISOString(),
            },
            ReturnValues: "ALL_NEW",
        };

        const result = await dynamodb.update(params).promise();
        return result.Attributes;
    }
}
