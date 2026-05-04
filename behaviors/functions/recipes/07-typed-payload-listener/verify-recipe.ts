import { schema } from './recipe';
import { verify } from '../_lib/verify';

const result = verify('07-typed-payload-listener', schema);
process.exit(result.clean ? 0 : 1);
