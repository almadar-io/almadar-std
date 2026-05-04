import { schema } from './recipe';
import { verify } from '../_lib/verify';

const result = verify('08-organism-slice', schema);
process.exit(result.clean ? 0 : 1);
