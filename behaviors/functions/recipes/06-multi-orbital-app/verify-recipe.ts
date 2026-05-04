import { schema } from './recipe';
import { verify } from '../_lib/verify';

const result = verify('06-multi-orbital-app', schema);
process.exit(result.clean ? 0 : 1);
