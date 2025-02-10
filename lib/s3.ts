import "server-only"

import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { createId } from "@paralleldrive/cuid2"

if (
	!process.env.AWS_REGION ||
	!process.env.AWS_ACCESS_KEY_ID ||
	!process.env.AWS_SECRET_ACCESS_KEY ||
	!process.env.AWS_S3_BUCKET_NAME
) {
	throw new Error(
		"AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME must be set"
	)
}

const s3Client = new S3Client({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
	}
})

/**
 * Uploads a file to S3 and returns the public URL
 * @param file The file to upload
 * @param maxSizeInBytes Optional maximum file size in bytes (default: 5MB). Set to 0 to disable size validation
 * @throws {Error} When file size exceeds maxSizeInBytes (if validation is enabled)
 * @returns {Promise<string>} The public URL of the uploaded file
 */
export async function uploadToS3(
	file: File,
	maxSizeInBytes: number = 5 * 1024 * 1024
): Promise<string> {
	if (maxSizeInBytes > 0 && file.size > maxSizeInBytes) {
		throw new Error(`File size exceeds limit of ${maxSizeInBytes} bytes`)
	}

	const key = createId()

	const arrayBuffer = await file.arrayBuffer()
	const uint8Array = new Uint8Array(arrayBuffer)

	const command = new PutObjectCommand({
		Bucket: process.env.AWS_S3_BUCKET_NAME,
		Key: key,
		Body: uint8Array,
		ContentType: file.type,
		ACL: "public-read"
	})

	await s3Client.send(command)

	return key
}

export async function getPresignedUrl(
	key: string,
	expiresIn = 3600
): Promise<string> {
	const command = new GetObjectCommand({
		Bucket: process.env.AWS_S3_BUCKET_NAME,
		Key: key
	})

	return getSignedUrl(s3Client, command, { expiresIn })
}
