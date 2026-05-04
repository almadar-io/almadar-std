import { schema } from './recipe';
import { verify } from '../_lib/verify';

const result = verify('05-cross-trait-listen', schema);
process.exit(result.clean ? 0 : 1);
