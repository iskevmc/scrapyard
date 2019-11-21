"use strict";
/*!
 * Copyright 2018-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const NAME_ILLEGAL_CHARS_REGEX = new RegExp('[^\\w+-.:]', 'g');
const REMOVE_UNDERSCORES_REGEX = new RegExp('_', 'g');
function toMetricData(array) {
    return [].concat(...array.map(metricEvent => {
        const namespace = metricEvent.namespace.replace(REMOVE_UNDERSCORES_REGEX, '');
        if (metricEvent.data !== undefined) {
            const mappedEventData = metricEvent.data.map(datum => {
                let metadata;
                let unit = datum.unit;
                if (datum.metadata !== undefined) {
                    metadata = Array.from(datum.metadata).map(entry => {
                        return { Key: entry[0], Value: entry[1] };
                    });
                }
                if (unit === undefined) {
                    unit = 'None';
                }
                const name = datum.name.replace(REMOVE_UNDERSCORES_REGEX, '');
                return {
                    MetricName: `${namespace}_${name}`.replace(NAME_ILLEGAL_CHARS_REGEX, ''),
                    EpochTimestamp: metricEvent.createTime.getTime(),
                    Unit: unit,
                    Value: datum.value,
                    Metadata: metadata
                };
            });
            return mappedEventData;
        }
        // case where there are no datum attached to the event, but we should still publish this
        return {
            MetricName: namespace.replace(NAME_ILLEGAL_CHARS_REGEX, ''),
            EpochTimestamp: metricEvent.createTime.getTime(),
            Unit: 'None',
            Value: 0
        };
    }));
}
exports.toMetricData = toMetricData;
//# sourceMappingURL=telemetryEvent.js.map