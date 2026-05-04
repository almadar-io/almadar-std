import { schema } from './recipe';
import { verify } from '../_lib/verify';

const result = verify('01-single-atom', schema);
process.exit(result.clean ? 0 : 1);
