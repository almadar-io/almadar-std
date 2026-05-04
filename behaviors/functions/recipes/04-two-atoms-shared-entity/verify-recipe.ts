import { schema } from './recipe';
import { verify } from '../_lib/verify';

const result = verify('04-two-atoms-shared-entity', schema);
process.exit(result.clean ? 0 : 1);
