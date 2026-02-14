export class FirestorePermissionError extends Error {
  refPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  resourceData?: any;

  constructor(
    message: string,
    refPath: string,
    operation: 'get' | 'list' | 'create' | 'update' | 'delete',
    resourceData?: any
  ) {
    super(message);
    this.name = 'FirestorePermissionError';
    this.refPath = refPath;
    this.operation = operation;
    this.resourceData = resourceData;
  }
}
