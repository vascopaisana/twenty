import { useApolloClient } from '@apollo/client';
import gql from 'graphql-tag';
import { useRecoilValue } from 'recoil';

import { objectMetadataItemsState } from '@/object-metadata/states/objectMetadataItemsState';
import { ObjectMetadataItem } from '@/object-metadata/types/ObjectMetadataItem';
import { mapObjectMetadataToGraphQLQuery } from '@/object-metadata/utils/mapObjectMetadataToGraphQLQuery';
import { useGetRecordFromCache } from '@/object-record/cache/hooks/useGetRecordFromCache';
import { getRecordNodeFromRecord } from '@/object-record/cache/utils/getRecordNodeFromRecord';
import { ObjectRecord } from '@/object-record/types/ObjectRecord';
import { prefillRecord } from '@/object-record/utils/prefillRecord';
import { capitalize } from '~/utils/string/capitalize';

export const useCreateOneRecordInCache = <T extends ObjectRecord>({
  objectMetadataItem,
}: {
  objectMetadataItem: ObjectMetadataItem;
}) => {
  const getRecordFromCache = useGetRecordFromCache({
    objectNameSingular: objectMetadataItem.nameSingular,
  });
  const objectMetadataItems = useRecoilValue(objectMetadataItemsState);
  const apolloClient = useApolloClient();

  return (record: ObjectRecord) => {
    const fragment = gql`
          fragment Create${capitalize(
            objectMetadataItem.nameSingular,
          )}InCache on ${capitalize(
            objectMetadataItem.nameSingular,
          )} ${mapObjectMetadataToGraphQLQuery({
            objectMetadataItems,
            objectMetadataItem,
            computeReferences: true,
          })}
        `;

    const prefilledRecord = prefillRecord({
      objectMetadataItem,
      input: record,
      depth: 1,
    });

    const recordToCreateWithNestedConnections = getRecordNodeFromRecord({
      record: prefilledRecord,
      objectMetadataItem,
      objectMetadataItems,
    });

    const cachedObjectRecord = {
      __typename: `${capitalize(objectMetadataItem.nameSingular)}`,
      ...recordToCreateWithNestedConnections,
    };

    apolloClient.writeFragment({
      id: `${capitalize(objectMetadataItem.nameSingular)}:${record.id}`,
      fragment,
      data: cachedObjectRecord,
    });
    return getRecordFromCache(record.id) as T;
  };
};
