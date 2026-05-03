import { v4 as uuidv4 } from "uuid";
import dynamodb from "../configs/dynamodb";
import { ConversationParticipantModel } from "./conversationParticipantModel";

const TABLE_NAME = "conversations";

export class ConversationModel {
    static async create(conversationData: any) {
        const conversation_id = uuidv4();
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

        await dynamodb.put(params).promise();
        return params.Item;
    }

    static async findById(conversationId: string) {
        const params = {
            TableName: TABLE_NAME,
            Key: { conversation_id: conversationId },
        };

        const result = await dynamodb.get(params).promise();
        return result.Item || null;
    }

    static async findByIdAndUserId(conversationId: string, userId: string) {
        const conversation = await this.findById(conversationId);
        if (!conversation) return null;

        // Check if user is participant
        const isParticipant = await ConversationParticipantModel.isMember(conversationId, userId);

        if (!isParticipant) return null;
        return conversation;
    }

    static async update(conversationId: string, updateData: any) {
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
            Key: { conversation_id: conversationId },
            UpdateExpression: `SET ${updateFields}, updated_at = :updated_at`,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW",
        };

        const result = await dynamodb.update(params).promise();
        return result.Attributes;
    }

    static async updateLastMessage(conversationId: string, messageId: string, timestamp: string) {
        return this.update(conversationId, {
            last_message_id: messageId,
            last_message_timestamp: timestamp,
        });
    }

    static async delete(conversationId: string) {
        const params = {
            TableName: TABLE_NAME,
            Key: { conversation_id: conversationId },
            UpdateExpression: "SET is_active = :is_active, updated_at = :updated_at",
            ExpressionAttributeValues: {
                ":is_active": false,
                ":updated_at": new Date().toISOString(),
            },
        };

        await dynamodb.update(params).promise();
    }
}
