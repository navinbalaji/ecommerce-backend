'use strict';

import mongoose from 'mongoose';

// schema
import Image from '#schema/image.schema.js';

// utils
import { successResponse, failureResponse, uploadImage } from '#common';

/**
 * Handles a POST request to upload a image.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const insertImage = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const { name, imageBase64 } = req.body;

        const isNameAlreadyExist = await Image.findOne({ name }).session(session).exec();

        if (isNameAlreadyExist) {
            throw new Error(
                'Image name already exist. Please try a different name'
            );
        }

        // Upload Image
        const url = await uploadImage(name,imageBase64);

        const [imageData] = await Image.create(
            [
                {
                    name,
                    url,
                },
            ],
            { session }
        );

        await session.commitTransaction();

        return res
            .status(200)
            .json(
                successResponse('Image uploaded successfully', { imageData })
            );
    } catch (err) {
        if (session.inTransaction) {
            await session.abortTransaction();
        }
        return res
            .status(400)
            .json(failureResponse(err?.message || 'something went wrong'));
    } finally {
        session.endSession();
    }
};

/**
 * Handles a DELETE request to delete a image.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const deleteImage = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const { id } = req.params;

        if (!id) {
            throw new Error('Image Id is missing');
        }
        // TODO: Handle delete in cloud

        const image = await Image.findByIdAndDelete(id).exec();

        if (!image) {
            throw new Error('Image not found');
        }
        await session.commitTransaction();

        return res
            .status(200)
            .json(successResponse('Image deleted successfully'));
    } catch (err) {
        if (session.inTransaction) {
            await session.abortTransaction();
        }
        return res
            .status(400)
            .json(failureResponse(err?.message || 'something went wrong'));
    }
};

/**
 * Handles a GET request to get all Images.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const getAllImages = async (req, res) => {
    try {
        const { page = 1, limit = 10, name, url } = req.query;

        const matchStage = {};

        if (name) {
            matchStage.name = { $regex: name, $options: 'i' };
        }

        if (url) {
            matchStage.url = { $regex: url, $options: 'i' };
        }

        const pipeline = [
            { $match: matchStage },
            {
                $facet: {
                    data: [
                        { $skip: Number(limit * (page - 1)) },
                        { $limit: Number(limit) },
                        { $sort: { _id: 1 } },
                    ],
                    totalCount: [{ $count: 'total' }],
                },
            },
            {
                $project: {
                    data: 1,
                    totalCount: { $arrayElemAt: ['$totalCount.total', 0] },
                },
            },
        ];

        const [images] = await Image.aggregate(pipeline);

        const { data, totalCount } = images;

        return res.status(200).json(
            successResponse('Images fetched successfully', {
                images: data,
                totalCount,
            })
        );
    } catch (err) {
        return res
            .status(400)
            .json(failureResponse(err?.message || 'Something went wrong'));
    }
};


